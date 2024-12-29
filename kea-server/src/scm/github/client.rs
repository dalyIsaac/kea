use std::path::PathBuf;

use super::error::KeaGitHubError;
use crate::{
    scm::scm_client::{AuthResponse, ScmClient},
    state::AppContext,
};
use axum::{
    body::Body,
    extract::Query,
    response::{IntoResponse, Redirect, Response},
};
use axum_extra::extract::{cookie::Cookie, PrivateCookieJar};
use oauth2::{
    basic::BasicTokenType, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, RedirectUrl, TokenResponse, TokenUrl,
};
use octocrab::{models, Octocrab};
use tracing::debug;

const GITHUB_COOKIE: &str = "github-sid";

macro_rules! redirect_if_no_cookie {
    ($jar:expr, $state:expr) => {
        match $jar.get(GITHUB_COOKIE) {
            Some(cookie) => secrecy::SecretString::new(cookie.value().into()),
            None => {
                return Ok(
                    Redirect::to(format!("{}github/login", $state.base_url).as_str())
                        .into_response(),
                )
            }
        }
    };
    () => {};
}

#[derive(Clone)]
struct GitHubConfig {
    app_id: models::AppId,
    app_key: jsonwebtoken::EncodingKey,
    client_id: ClientId,
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

        let client_id =
            ClientId::new(std::env::var("GITHUB_CLIENT_ID").expect("GITHUB_CLIENT_ID must be set"));

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
        let auth_url = AuthUrl::new("https://github.com/login/oauth/authorize".to_string())
            .expect("Invalid authorization endpoint URL");
        let token_url = TokenUrl::new("https://github.com/login/oauth/access_token".to_string())
            .expect("Invalid token endpoint URL");

        let client = oauth2::basic::BasicClient::new(
            self.config.client_id.clone(),
            Some(self.config.client_secret.clone()),
            auth_url,
            Some(token_url),
        )
        .set_redirect_uri(
            RedirectUrl::new(format!("{}github/login", ctx.base_url))
                .expect("Invalid redirect URL"),
        );

        let auth_response = match query {
            Some(Query(auth)) => auth,
            None => {
                let (auth_url, _csrf_token) = client.authorize_url(CsrfToken::new_random).url();
                return Ok(Redirect::to(auth_url.as_str()).into_response());
            }
        };

        let code = match auth_response {
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
            AuthResponse::Success { code } => AuthorizationCode::new(code),
        };

        let token_result = client
            .exchange_code(code)
            .request_async(async_http_client)
            .await
            .map_err(|e| KeaGitHubError::TokenError(e.to_string()))?;

        match token_result.token_type() {
            BasicTokenType::Bearer => (),
            _ => {
                return Err(KeaGitHubError::TokenError(
                    "Invalid token type received".to_string(),
                ))
            }
        }

        let Some(max_age) = token_result.expires_in() else {
            return Err(KeaGitHubError::TokenError(
                "No expiry time received".to_string(),
            ));
        };

        let max_age =
            time::Duration::seconds(max_age.as_secs().try_into().map_err(|_| {
                KeaGitHubError::TokenError("Token expiry time too large".to_string())
            })?);
        let access_token = token_result.access_token().secret().clone();

        let domain = ctx.base_url.clone().host().unwrap().to_string();

        let cookie = Cookie::build((GITHUB_COOKIE, access_token))
            .domain(domain)
            .path("/")
            .secure(true)
            .http_only(true)
            .max_age(max_age);

        Ok((jar.add(cookie), Redirect::to("/github/me")).into_response())
    }

    async fn me(
        &self,
        jar: PrivateCookieJar,
        state: AppContext,
    ) -> Result<Response, KeaGitHubError> {
        let access_token = redirect_if_no_cookie!(jar, state);

        let client = self.create_user_client(access_token)?;

        let user = client.current().user().await?;
        let body = Body::from(serde_json::to_string(&user).unwrap());
        Ok(Response::new(body))
    }
}
