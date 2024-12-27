use crate::scm::github::{client::GITHUB_REDIRECT_URI, error::KeaGitHubError};
use crate::scm::scm_client::{AuthResponse, ScmClient};
use crate::state::AppState;
use axum::{
    extract::{Query, State},
    response::Response,
};
use axum_extra::extract::cookie::PrivateCookieJar;

pub const GITHUB_LOGIN_ROUTE: &str = GITHUB_REDIRECT_URI;

#[axum::debug_handler]
pub async fn login(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    query: Option<Query<AuthResponse>>,
) -> Result<Response, KeaGitHubError> {
    let AppState { clients, ctx } = state;
    clients.github.login(query, jar, ctx).await
}
