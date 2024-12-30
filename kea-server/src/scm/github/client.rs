use serde::{Deserialize, Serialize};
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

const GITHUB_COOKIE: &str = "github-tokens";

/// Ensures that the user is authenticated. If the user's access token has expired, the refresh token
/// is used to obtain a new access token.
/// If the user is not authenticated, the user is redirected to the GitHub login page.
/// If the user is authenticated, the cookie jar and the authenticated GitHub client are returned.
///
/// The cookie jar should always be returned in the response.
///
macro_rules! with_valid_client {
    ($jar:expr, $client:expr, $state:expr) => {
        match $client.get_client_with_token($jar, &$state).await {
            Ok((jar, client)) => (jar, client),
            Err(response) => return Ok(response),
        }
    };
}

#[derive(Serialize, Deserialize)]
struct TokenCookie {
    access_token: String,
    refresh_token: Option<String>,

    /// The expiry time of the token in seconds since the Unix epoch.
    expires_at: i64,
}

#[derive(Clone)]
struct GitHubConfig {
    app_id: models::AppId,
    app_key: jsonwebtoken::EncodingKey,
    client_id: ClientId,
    client_secret: ClientSecret,
    auth_url: AuthUrl,
    token_url: TokenUrl,
}

#[derive(Clone)]
pub struct GitHubClient {
    config: GitHubConfig,
}

impl GitHubClient {
    /// Create an authenticated OAuth client for the GitHub API.
    fn create_oauth_client(&self, ctx: &AppContext) -> oauth2::basic::BasicClient {
        oauth2::basic::BasicClient::new(
            self.config.client_id.clone(),
            Some(self.config.client_secret.clone()),
            self.config.auth_url.clone(),
            Some(self.config.token_url.clone()),
        )
        .set_redirect_uri(
            RedirectUrl::new(format!("{}github/login", ctx.base_url))
                .expect("Invalid redirect URL"),
        )
    }

    /// Create a token cookie from a token response.
    fn create_token_cookie(
        token_result: oauth2::StandardTokenResponse<oauth2::EmptyExtraTokenFields, BasicTokenType>,
    ) -> Result<TokenCookie, Box<KeaGitHubError>> {
        let expires_in = token_result.expires_in().ok_or_else(|| {
            Box::new(KeaGitHubError::TokenError(
                "No expiry time received".to_string(),
            ))
        })?;

        let expires_at = time::OffsetDateTime::now_utc()
            .checked_add(time::Duration::seconds(
                expires_in.as_secs().try_into().map_err(|_| {
                    Box::new(KeaGitHubError::TokenError(
                        "Token expiry time too large".to_string(),
                    ))
                })?,
            ))
            .ok_or_else(|| {
                Box::new(KeaGitHubError::TokenError(
                    "Failed to calculate expiry time".to_string(),
                ))
            })?
            .unix_timestamp();

        Ok(TokenCookie {
            access_token: token_result.access_token().secret().clone(),
            refresh_token: token_result.refresh_token().map(|t| t.secret().clone()),
            expires_at,
        })
    }

    /// Create a client for the GitHub API using a user access token from a token cookie.
    pub fn create_github_user_client(
        &self,
        user_access_token: secrecy::SecretString,
    ) -> Result<Octocrab, Box<KeaGitHubError>> {
        Octocrab::builder()
            .user_access_token(user_access_token)
            .build()
            .map_err(|e| Box::new(KeaGitHubError::ApiError(e)))
    }

    /// Refresh the access token using the refresh token.
    async fn refresh_token(
        &self,
        refresh_token: String,
        ctx: &AppContext,
    ) -> Result<TokenCookie, Box<KeaGitHubError>> {
        let client = self.create_oauth_client(ctx);

        let token_result = client
            .exchange_refresh_token(&oauth2::RefreshToken::new(refresh_token))
            .request_async(async_http_client)
            .await
            .map_err(|e| Box::new(KeaGitHubError::TokenError(e.to_string())))?;

        Self::create_token_cookie(token_result).map_err(|e| Box::new(*e))
    }

    /// Check if the token is still valid given the current time.
    fn is_token_valid(&self, token_cookie: &TokenCookie) -> bool {
        let now = time::OffsetDateTime::now_utc().unix_timestamp();
        now < token_cookie.expires_at
    }

    /// Create a redirect to the Kea GitHub login route. This route will either:
    ///
    /// - Redirect to the GitHub login page if the user is not logged in.
    /// - Redirect to the GitHub OAuth callback if the user is logged in.
    fn create_login_redirect(&self, state: &AppContext) -> Response {
        Redirect::to(format!("{}github/login", state.base_url).as_str()).into_response()
    }

    /// Extract the token cookie from the cookie jar.
    fn extract_token_cookie(
        &self,
        jar: &PrivateCookieJar,
        state: &AppContext,
    ) -> Result<TokenCookie, Response> {
        let cookie = match jar.get(GITHUB_COOKIE) {
            Some(cookie) => cookie,
            None => {
                debug!("No token cookie found in jar");
                return Err(self.create_login_redirect(state));
            }
        };

        serde_json::from_str(cookie.value()).map_err(|e| {
            debug!(?e, "Failed to deserialize token cookie");
            self.create_login_redirect(state)
        })
    }

    /// Get a client with a valid token, refreshing it if necessary.
    /// If the token is invalid and there is no refresh token, a login redirect is returned in the error.
    async fn get_client_with_token(
        &self,
        jar: PrivateCookieJar,
        state: &AppContext,
    ) -> Result<(PrivateCookieJar, Octocrab), Response> {
        let token_cookie = match self.extract_token_cookie(&jar, state) {
            Ok(cookie) => cookie,
            Err(response) => return Err(response),
        };

        if self.is_token_valid(&token_cookie) {
            let client = self
                .create_github_user_client(secrecy::SecretString::new(
                    token_cookie.access_token.into(),
                ))
                .map_err(|e| {
                    debug!(?e, "Failed to create client with valid token");
                    self.create_login_redirect(state)
                })?;

            return Ok((jar, client));
        }

        debug!("Token expired, attempting refresh");
        let Some(refresh_token) = token_cookie.refresh_token else {
            debug!("No refresh token available");
            return Err(self.create_login_redirect(state));
        };

        let new_token = self
            .refresh_token(refresh_token, state)
            .await
            .map_err(|e| {
                debug!(?e, "Failed to refresh token");
                self.create_login_redirect(state)
            })?;

        let domain = state.base_url.clone().host().unwrap().to_string();
        let cookie = Cookie::build((
            GITHUB_COOKIE,
            serde_json::to_string(&new_token).map_err(|e| {
                debug!(?e, "Failed to serialize new token cookie");
                self.create_login_redirect(state)
            })?,
        ))
        .domain(domain)
        .path("/")
        .secure(true)
        .same_site(axum_extra::extract::cookie::SameSite::Strict)
        .http_only(true);

        let jar = jar.add(cookie);
        let client = self
            .create_github_user_client(secrecy::SecretString::new(new_token.access_token.into()))
            .map_err(|e| {
                debug!(?e, "Failed to create client with refreshed token");
                self.create_login_redirect(state)
            })?;

        Ok((jar, client))
    }
}

impl ScmClient<Box<KeaGitHubError>> for GitHubClient {
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

        let auth_url = AuthUrl::new("https://github.com/login/oauth/authorize".to_string())
            .expect("Invalid authorization endpoint URL");
        let token_url = TokenUrl::new("https://github.com/login/oauth/access_token".to_string())
            .expect("Invalid token endpoint URL");

        GitHubClient {
            config: GitHubConfig {
                app_id,
                app_key,
                client_id,
                client_secret,
                auth_url,
                token_url,
            },
        }
    }

    async fn login(
        &self,
        query: Option<Query<AuthResponse>>,
        jar: PrivateCookieJar,
        ctx: AppContext,
    ) -> Result<Response, Box<KeaGitHubError>> {
        let client = self.create_oauth_client(&ctx);

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
                return Err(Box::new(KeaGitHubError::AuthError {
                    error,
                    error_description,
                    error_url,
                }));
            }
            AuthResponse::Success { code } => AuthorizationCode::new(code),
        };

        let token_result = client
            .exchange_code(code)
            .request_async(async_http_client)
            .await
            .map_err(|e| Box::new(KeaGitHubError::TokenError(e.to_string())))?;

        match token_result.token_type() {
            BasicTokenType::Bearer => (),
            _ => {
                return Err(Box::new(KeaGitHubError::TokenError(
                    "Invalid token type received".to_string(),
                )))
            }
        }

        let token_cookie = Self::create_token_cookie(token_result).map_err(|e| Box::new(*e))?;
        let max_age = time::Duration::seconds(
            token_cookie.expires_at - time::OffsetDateTime::now_utc().unix_timestamp(),
        );

        let domain = ctx.base_url.clone().host().unwrap().to_string();
        let cookie = Cookie::build((
            GITHUB_COOKIE,
            serde_json::to_string(&token_cookie)
                .map_err(|e| Box::new(KeaGitHubError::TokenError(e.to_string())))?,
        ))
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
    ) -> Result<Response, Box<KeaGitHubError>> {
        let (jar, client) = with_valid_client!(jar, self, state);

        let user = client.current().user().await?;
        let body = Body::from(serde_json::to_string(&user).unwrap());
        Ok((jar, Response::new(body)).into_response())
    }
}
