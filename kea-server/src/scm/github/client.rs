use std::path::PathBuf;

use axum::{
    body::Body,
    extract::Query,
    http::Uri,
    response::{IntoResponse, Redirect, Response},
};
use axum_extra::extract::{cookie::Cookie, PrivateCookieJar};
use oauth2::ClientSecret;
use octocrab::{auth, models, Octocrab};
use secrecy::ExposeSecret;
use tracing::debug;

use crate::{
    scm::scm_client::{AuthResponse, ScmClient},
    state::AppContext,
};

use super::error::KeaGitHubError;

pub const GITHUB_REDIRECT_URI: &str = "/github/login";

const GITHUB_COOKIE: &str = "github-sid";

#[derive(Clone)]
struct GitHubConfig {
    app_id: models::AppId,
    app_key: jsonwebtoken::EncodingKey,
    client_id: String,
    client_secret: ClientSecret,
}

#[derive(Clone)]
pub struct GitHubClient {
    config: GitHubConfig,
}

impl GitHubClient {
    pub fn create_anonymous_client(&self) -> Result<Octocrab, KeaGitHubError> {
        Octocrab::builder()
            .app(self.config.app_id, self.config.app_key.clone())
            .build()
            .map_err(|e| KeaGitHubError::ApiError(e))
    }

    pub fn create_user_client(
        &self,
        user_access_token: secrecy::SecretString,
    ) -> Result<Octocrab, KeaGitHubError> {
        Octocrab::builder()
            .user_access_token(user_access_token)
            .build()
            .map_err(|e| KeaGitHubError::ApiError(e))
    }

    pub fn get_oauth_redirect_url(&self, base_url: &Uri) -> String {
        format!(
            "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}{}",
            self.config.client_id,
            base_url.to_string().trim_end_matches('/'),
            GITHUB_REDIRECT_URI
        )
    }
}

impl ScmClient<KeaGitHubError> for GitHubClient {
    fn new() -> Self {
        let app_id: models::AppId = std::env::var("GITHUB_APP_ID")
            .expect("GITHUB_APP_ID must be set")
            .parse::<u64>()
            .expect("Invalid GitHub App ID")
            .into();

        let key_path: PathBuf = std::env::var("GITHUB_APP_KEY_PATH")
            .expect("GITHUB_APP_KEY_PATH must be set")
            .parse()
            .expect("Invalid GitHub App key path");

        let key_contents = std::fs::read_to_string(key_path).expect("Failed to read key file");
        let app_key = jsonwebtoken::EncodingKey::from_rsa_pem(key_contents.as_bytes())
            .expect("Invalid RSA key");

        let client_id = std::env::var("GITHUB_CLIENT_ID").expect("GITHUB_CLIENT_ID must be set");

        let client_secret = ClientSecret::new(
            std::env::var("GITHUB_CLIENT_SECRET").expect("GITHUB_CLIENT_SECRET must be set"),
        );

        GitHubClient {
            config: GitHubConfig {
                app_id,
                app_key,
                client_id,
                client_secret,
            },
        }
    }

    async fn login(
        &self,
        query: Option<Query<AuthResponse>>,
        jar: PrivateCookieJar,
        ctx: AppContext,
    ) -> Result<Response, KeaGitHubError> {
        let auth_response = match query {
            Some(Query(auth)) => auth,
            None => {
                return Ok(Redirect::to(&self.get_oauth_redirect_url(&ctx.base_url)).into_response())
            }
        };

        let token = match auth_response {
            AuthResponse::Failure {
                error,
                error_description,
                error_url,
            } => {
                debug!(?error, ?error_description, ?error_url);
                return Err(KeaGitHubError::AuthError {
                    error,
                    error_description,
                    error_url,
                });
            }
            AuthResponse::Success { code } => {
                let body = [
                    ("client_id", self.config.client_id.as_str()),
                    ("client_secret", self.config.client_secret.secret()),
                    ("code", code.as_str()),
                ];

                let token: auth::OAuth = self
                    .create_anonymous_client()?
                    .post("/login/oauth/access_token", Some(&body))
                    .await?;

                token
            }
        };

        if !token.token_type.eq_ignore_ascii_case("bearer") {
            return Err(KeaGitHubError::TokenError(
                "Invalid token type received".to_string(),
            ));
        }

        if token.scope.is_empty() {
            return Err(KeaGitHubError::TokenError("No scopes received".to_string()));
        }

        let Some(secs) = token.expires_in else {
            return Err(KeaGitHubError::TokenError(
                "No expiry time received".to_string(),
            ));
        };

        let max_age = time::Duration::seconds(secs.try_into().unwrap());
        let access_token = token.access_token.clone().expose_secret().to_string();
        let domain = ctx.base_url.clone().host().unwrap().to_string();

        let cookie = Cookie::build((GITHUB_COOKIE, access_token))
            .domain(domain)
            .path("/")
            .secure(true)
            .http_only(true)
            .max_age(max_age);

        Ok((jar.add(cookie), Redirect::to("/")).into_response())
    }

    async fn me(
        &self,
        jar: PrivateCookieJar,
        state: AppContext,
    ) -> Result<Response, KeaGitHubError> {
        let access_token = match jar.get(GITHUB_COOKIE) {
            Some(cookie) => secrecy::SecretString::new(cookie.value().into()),
            None => {
                return Ok(
                    Redirect::to(&self.get_oauth_redirect_url(&state.base_url)).into_response()
                )
            }
        };

        let client = self.create_user_client(access_token)?;

        let user = client.current().user().await?;
        let body = Body::from(serde_json::to_string(&user).unwrap());
        Ok(Response::new(body))
    }
}
