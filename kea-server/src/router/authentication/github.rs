use axum::{
    extract::{Query, State},
    response::Redirect,
};
use axum_extra::extract::cookie::PrivateCookieJar;

use crate::{
    client::scm_client::{AuthResponse, ScmClient},
    error::KeaError,
    AppState,
};

#[axum::debug_handler]
pub async fn login(
    State(mut state): State<AppState>,
    jar: PrivateCookieJar,
    query: Option<Query<AuthResponse>>,
) -> Result<Redirect, KeaError> {
    state
        .clients
        .github
        .login(query, &jar, &mut state.ctx)
        .await
}
