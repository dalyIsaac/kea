use crate::scm::github::error::KeaGitHubError;
use crate::scm::scm_client::{AuthResponse, ScmClient};
use crate::state::AppState;
use axum::{
    extract::{Query, State},
    response::Response,
};
use axum_extra::extract::cookie::PrivateCookieJar;

#[axum::debug_handler]
#[utoipa::path(get, path = "/github/signin", responses((status = OK, body = String)))]
pub async fn sign_in(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    query: Option<Query<AuthResponse>>,
) -> Result<Response, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;
    clients.github.sign_in(query, jar, ctx).await
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/github/signout", responses((status = OK, body = String)))]
pub async fn sign_out(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
) -> Result<Response, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;
    clients.github.sign_out(jar, ctx).await
}
