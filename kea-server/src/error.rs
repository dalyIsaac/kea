use axum::{http::Response, response::IntoResponse};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum KeaError {
    #[error("GitHub authentication error: {error_description}")]
    GitHubAuthError {
        error: String,
        error_description: String,
        error_url: String,
    },

    #[error("Github client creation error: {0}")]
    GitHubClientCreationError(Box<octocrab::Error>),
}

impl IntoResponse for KeaError {
    fn into_response(self) -> Response<axum::body::Body> {
        let status = match self {
            KeaError::GitHubAuthError { .. } => axum::http::StatusCode::UNAUTHORIZED,
            _ => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        };

        Response::builder()
            .status(status)
            .body(self.to_string().into())
            .unwrap()
    }
}
