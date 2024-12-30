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

    #[error("GitHub API error: {0}")]
    ApiError(#[from] octocrab::Error),

    #[error("GitHub user with id {0} has no email")]
    UserHasNoEmail(UserId),
}

impl IntoResponse for Box<KeaGitHubError> {
    fn into_response(self) -> Response<axum::body::Body> {
        let status = match *self {
            KeaGitHubError::AuthError { .. } => axum::http::StatusCode::UNAUTHORIZED,
            _ => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        };

        let body = match *self {
            KeaGitHubError::AuthError {
                error_description,
                error_url,
                error,
                ..
            } => format!("{}: {}\n{}", error, error_description, error_url),

            KeaGitHubError::ApiError(e) => match e {
                octocrab::Error::GitHub {
                    source,
                    backtrace: _,
                } => format!("{}: {}", source.status_code, source.message),

                _ => e.to_string(),
            },

            _ => self.to_string(),
        };

        Response::builder()
            .status(status)
            .body(body.into())
            .unwrap()
    }
}

impl From<octocrab::Error> for Box<KeaGitHubError> {
    fn from(e: octocrab::Error) -> Box<KeaGitHubError> {
        Box::new(KeaGitHubError::ApiError(e))
    }
}
