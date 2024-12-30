use crate::scm::github::error::KeaGitHubError;
use crate::scm::scm_client::{AuthResponse, ScmClient};
use crate::state::AppState;
use axum::{
    extract::{Query, State},
    response::Response,
};
use axum_extra::extract::cookie::PrivateCookieJar;

#[axum::debug_handler]
pub async fn login(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    query: Option<Query<AuthResponse>>,
) -> Result<Response, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;
    clients.github.login(query, jar, ctx).await
}

#[axum::debug_handler]
pub async fn me(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
) -> Result<Response, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;
    clients.github.me(jar, ctx).await
}
