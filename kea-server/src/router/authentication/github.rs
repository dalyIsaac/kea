use axum::{
    extract::{Query, State},
    response::Redirect,
};

use crate::{
    client::scm_client::{AuthResponse, ScmClient},
    error::KeaError,
    AppState,
};

#[axum::debug_handler]
pub async fn login(
    State(AppState { github_client }): State<AppState>,
    query: Option<Query<AuthResponse>>,
) -> Result<Redirect, KeaError> {
    github_client.login(query).await
}
