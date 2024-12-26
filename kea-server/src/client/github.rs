use std::path::PathBuf;

use axum::{extract::Query, http::Uri, response::Redirect};
use oauth2::ClientSecret;
use octocrab::{auth, models, Octocrab};
use tracing::debug;

use crate::error::KeaError;

use super::scm_client::{AuthResponse, ScmClient};

const GITHUB_REDIRECT_URI: &str = "/login/github";
pub const GITHUB_LOGIN_URI: &str = GITHUB_REDIRECT_URI;

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
    pub fn create_anonymous_client(&self) -> Result<Octocrab, KeaError> {
        Octocrab::builder()
            .app(self.config.app_id, self.config.app_key.clone())
            .build()
            .map_err(|e| KeaError::GitHubClientCreationError(Box::new(e)))
    }

    pub fn create_user_client(
        &self,
        user_access_token: secrecy::SecretString,
    ) -> Result<Octocrab, KeaError> {
        Octocrab::builder()
            .user_access_token(user_access_token)
            .build()
            .map_err(|e| KeaError::GitHubClientCreationError(Box::new(e)))
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

impl ScmClient for GitHubClient {
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
        jar: &PrivateCookieJar,
        ctx: &mut AppContext,
    ) -> Result<Redirect, KeaError> {
        let auth_response = match query {
            Some(Query(auth)) => auth,
            None => return Ok(Redirect::to(&self.get_oauth_redirect_url(&ctx.base_url))),
        };

        let token = match auth_response {
            AuthResponse::Failure {
                error,
                error_description,
                error_url,
            } => {
                debug!(?error, ?error_description, ?error_url);
                return Err(KeaError::GitHubAuthError {
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
                    .post("login/oauth/access_token", Some(&body))
                    .await?;

                token
            }
        };

        if !token.token_type.eq_ignore_ascii_case("bearer") {
            return Err(KeaError::GitHubTokenError(
                "Invalid token type received".to_string(),
            ));
        }

        if token.scope.is_empty() {
            return Err(KeaError::GitHubTokenError("No scopes received".to_string()));
        }

        let Some(secs) = token.expires_in else {
            return Err(KeaError::GitHubTokenError(
                "No expiry time received".to_string(),
            ));
        };
        let max_age = time::Duration::seconds(secs.try_into().unwrap());
        let cookie = Cookie::build((GITHUB_COOKIE, token.access_token.expose_secret()))
            .domain(&ctx.base_url.host().unwrap().to_string())
            .path("/")
            .secure(true)
            .http_only(true)
            .max_age(max_age);

        jar.add(cookie);

        Ok(Redirect::to("/"))
    }
}
