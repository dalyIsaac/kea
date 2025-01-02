use super::error::KeaGitHubError;
use crate::state::AppContext;
use axum_extra::extract::{cookie::Cookie, PrivateCookieJar};
use oauth2::{
    basic::BasicTokenType, reqwest::async_http_client, AuthUrl, ClientId, ClientSecret,
    RedirectUrl, TokenResponse, TokenUrl,
};
use octocrab::Octocrab;
use serde::{Deserialize, Serialize};
use tracing::debug;

pub const GITHUB_COOKIE: &str = "github-tokens";

#[derive(Serialize, Deserialize)]
pub struct TokenCookie {
    access_token: String,
    refresh_token: Option<String>,

    /// The expiry time of the token in seconds since the Unix epoch.
    expires_at: i64,
}

#[derive(Clone)]
struct GitHubConfig {
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
    pub fn new() -> Self {
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
                client_id,
                client_secret,
                auth_url,
                token_url,
            },
        }
    }

    /// Create an authenticated OAuth client for the GitHub API.
    pub fn create_oauth_client(&self, ctx: &AppContext) -> oauth2::basic::BasicClient {
        oauth2::basic::BasicClient::new(
            self.config.client_id.clone(),
            Some(self.config.client_secret.clone()),
            self.config.auth_url.clone(),
            Some(self.config.token_url.clone()),
        )
        .set_redirect_uri(
            RedirectUrl::new(format!("{}/github/signin", ctx.get_server_url()))
                .expect("Invalid redirect URL"),
        )
    }

    /// Create a token cookie from a token response.
    pub fn create_token_cookie(
        token_result: oauth2::StandardTokenResponse<oauth2::EmptyExtraTokenFields, BasicTokenType>,
    ) -> Result<TokenCookie, Box<KeaGitHubError>> {
        let expires_in = token_result.expires_in().ok_or_else(|| {
            Box::new(KeaGitHubError::TokenCookieConstruction(
                "No expiry time received".to_string(),
            ))
        })?;

        let expires_at = time::OffsetDateTime::now_utc()
            .checked_add(time::Duration::seconds(
                expires_in.as_secs().try_into().map_err(|_| {
                    Box::new(KeaGitHubError::TokenCookieConstruction(
                        "Token expiry time too large".to_string(),
                    ))
                })?,
            ))
            .ok_or_else(|| {
                Box::new(KeaGitHubError::TokenCookieConstruction(
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
            .map_err(|e| Box::new(KeaGitHubError::Octocrab(e)))
    }

    pub fn add_cookie(
        &self,
        jar: PrivateCookieJar,
        token_cookie: &TokenCookie,
        ctx: &AppContext,
    ) -> Result<PrivateCookieJar, Box<KeaGitHubError>> {
        let max_age = time::Duration::seconds(
            token_cookie.expires_at - time::OffsetDateTime::now_utc().unix_timestamp(),
        );

        let cookie = Cookie::build((
            GITHUB_COOKIE,
            serde_json::to_string(&token_cookie)
                .map_err(|e| Box::new(KeaGitHubError::OAuth2Error(e.to_string())))?,
        ))
        .domain(ctx.domain.clone())
        .path("/")
        .secure(true)
        .http_only(true)
        .max_age(max_age);

        Ok(jar.add(cookie))
    }

    /// Refresh the access token using the refresh token.
    async fn refresh_token(
        &self,
        jar: PrivateCookieJar,
        refresh_token: String,
        ctx: &AppContext,
    ) -> Result<(PrivateCookieJar, TokenCookie), Box<KeaGitHubError>> {
        let mut jar = jar;
        let client = self.create_oauth_client(ctx);

        let token_result = client
            .exchange_refresh_token(&oauth2::RefreshToken::new(refresh_token))
            .request_async(async_http_client)
            .await
            .map_err(|e| Box::new(KeaGitHubError::OAuth2Error(e.to_string())))?;

        let token_cookie = Self::create_token_cookie(token_result)?;
        jar = self.add_cookie(jar, &token_cookie, ctx)?;

        Ok((jar, token_cookie))
    }

    /// Extract the GitHub token cookie from the cookie jar.
    fn extract_token_cookie(
        &self,
        jar: &PrivateCookieJar,
    ) -> Result<TokenCookie, Box<KeaGitHubError>> {
        let cookie = match jar.get(GITHUB_COOKIE) {
            Some(cookie) => cookie,
            None => {
                debug!("No token cookie found in jar");
                return Err(Box::new(KeaGitHubError::NoTokenCookie));
            }
        };

        match serde_json::from_str(cookie.value()) {
            Ok(cookie) => Ok(cookie),
            Err(_e) => Err(Box::new(KeaGitHubError::TokenCookieDeserialization)),
        }
    }

    /// Check if the token is still valid given the current time.
    fn is_token_valid(&self, token_cookie: &TokenCookie) -> bool {
        let now = time::OffsetDateTime::now_utc().unix_timestamp();
        now < token_cookie.expires_at
    }

    /// Get a client with a valid token, refreshing it if necessary.
    /// If the token is invalid and there is no refresh token, a login redirect is returned in the error.
    pub async fn get_client_with_token(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
    ) -> Result<(PrivateCookieJar, Octocrab), Box<KeaGitHubError>> {
        let mut jar = jar;
        let mut token_cookie = match self.extract_token_cookie(&jar) {
            Ok(cookie) => cookie,
            Err(e) => return Err(e),
        };

        if !self.is_token_valid(&token_cookie) {
            return Err(Box::new(KeaGitHubError::NotAuthenticated));
        }

        // Refresh if there is less than 5 minutes left on the token.
        let now = time::OffsetDateTime::now_utc().unix_timestamp();
        let secs_left = token_cookie.expires_at - now;
        let should_refresh = secs_left < 300;

        if should_refresh {
            debug!("Token is about to expire, refreshing");
            (jar, token_cookie) = match self
                .refresh_token(jar, token_cookie.refresh_token.clone().unwrap(), ctx)
                .await
            {
                Ok(token) => token,
                Err(e) => {
                    debug!(?e, "Failed to refresh token");
                    return Err(e);
                }
            };
        }

        let client = self.create_github_user_client(secrecy::SecretString::new(
            token_cookie.access_token.into(),
        ))?;

        Ok((jar, client))
    }
}

impl Default for GitHubClient {
    fn default() -> Self {
        Self::new()
    }
}
