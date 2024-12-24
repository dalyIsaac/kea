use axum::{extract::Query, response::Redirect};

use crate::error::KeaError;

#[derive(Debug, serde::Deserialize)]
pub enum AuthResponse {
    Success {
        code: String,
    },
    Failure {
        error: String,
        error_description: String,
        error_url: String,
    },
}

pub trait ScmClient {
    fn new() -> Self;
    async fn login(&self, query: Option<Query<AuthResponse>>) -> Result<Redirect, KeaError>;

    // TODO: Implement this method
    // async fn logout(&self, query: Option<Query<AuthResponse>>) -> Result<Redirect, KeaError>;
}
