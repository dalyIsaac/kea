use super::{
    client::{GitHubClient, GITHUB_COOKIE},
    error::KeaGitHubError,
};
use crate::{
    scm::scm_client::{AuthResponse, ScmAuthClient, ScmUser},
    state::AppContext,
};
use axum::{
    extract::Query,
    response::{IntoResponse, Redirect, Response},
};
use axum_extra::extract::{cookie::Cookie, PrivateCookieJar};
use oauth2::{
    basic::BasicTokenType, reqwest::async_http_client, AuthorizationCode, CsrfToken, TokenResponse,
};
use tracing::debug;

impl ScmAuthClient<Box<KeaGitHubError>> for GitHubClient {
    async fn sign_in(
        &self,
        query: Option<Query<AuthResponse>>,
        jar: PrivateCookieJar,
        ctx: &AppContext,
    ) -> Result<Response, Box<KeaGitHubError>> {
        let mut jar = jar;
        let client = self.create_oauth_client(ctx);

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
                return Err(Box::new(KeaGitHubError::Auth {
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
            .map_err(|e| Box::new(KeaGitHubError::OAuth2Error(e.to_string())))?;

        match token_result.token_type() {
            BasicTokenType::Bearer => (),
            _ => {
                return Err(Box::new(KeaGitHubError::InvalidTokenType));
            }
        }

        let token_cookie = Self::create_token_cookie(token_result)?;
        jar = self.add_cookie(jar, &token_cookie, ctx)?;

        Ok((jar, Redirect::to(&ctx.client_url)).into_response())
    }

    async fn sign_out(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
    ) -> Result<Response, Box<KeaGitHubError>> {
        let mut jar = jar;

        jar = jar.remove(Cookie::build(GITHUB_COOKIE));

        // Create a new cookie with an expiry time in the past to delete the cookie.
        let cookie = Cookie::build((GITHUB_COOKIE, ""))
            .domain(ctx.domain.clone())
            .path("/")
            .secure(true)
            .http_only(true)
            .max_age(time::Duration::seconds(-1));

        jar = jar.add(cookie);

        Ok((jar, Redirect::to(&ctx.client_url)).into_response())
    }

    async fn get_cookie_user(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
    ) -> Result<(PrivateCookieJar, ScmUser), Box<KeaGitHubError>> {
        match self.get_client_with_token(jar, ctx).await {
            Ok((jar, client)) => {
                let user: ScmUser = client.current().user().await?.into();

                Ok((jar, user))
            }
            Err(e) => Err(e),
        }
    }
}
