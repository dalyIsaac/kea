use axum::{http::Response, response::IntoResponse};
use octocrab::models::UserId;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum KeaGitHubError {
    #[error("GitHub authentication error: {error_description}")]
    AuthError {
        error: String,
        error_description: String,
        error_url: String,
    },

    #[error("GitHub token error: {0}")]
    TokenError(String),

    #[error("Github client creation error: {0}")]
    ClientCreationError(Box<octocrab::Error>),

    #[error("GitHub API error: {0}")]
    ApiError(Box<octocrab::Error>),

    #[error("GitHub user with id {0} has no email")]
    UserHasNoEmail(UserId),
}

impl IntoResponse for KeaGitHubError {
    fn into_response(self) -> Response<axum::body::Body> {
        let status = match self {
            KeaGitHubError::AuthError { .. } => axum::http::StatusCode::UNAUTHORIZED,
            _ => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        };

        Response::builder()
            .status(status)
            .body(self.to_string().into())
            .unwrap()
    }
}

impl From<octocrab::Error> for KeaGitHubError {
    fn from(err: octocrab::Error) -> Self {
        KeaGitHubError::ApiError(Box::new(err))
    }
}
