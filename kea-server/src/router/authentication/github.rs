use axum::{
    extract::{Query, State},
    response::Response,
};
use axum_extra::extract::cookie::PrivateCookieJar;

use crate::{
    client::scm_client::{AuthResponse, ScmClient},
    error::KeaError,
    AppState,
};

#[axum::debug_handler]
pub async fn login(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    query: Option<Query<AuthResponse>>,
) -> Result<Response, KeaError> {
    let AppState { clients, ctx } = state;
    clients.github.login(query, jar, ctx).await
}
