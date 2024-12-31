use axum::{http::Response, response::IntoResponse};
use octocrab::models::UserId;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum KeaGitHubError {
    #[error("GitHub authentication error: {error_description}")]
    Auth {
        error: String,
        error_description: String,
        error_url: String,
    },

    #[error("GitHub token cookie construction error: {0}")]
    TokenCookieConstruction(String),

    #[error("OAuth2 error: {0}")]
    OAuth2Error(String),

    #[error("Invalid token type received from GitHub, expected 'bearer'")]
    InvalidTokenType,

    #[error("No GitHub token cookie found in request")]
    NoTokenCookie,

    #[error("Failed to deserialize GitHub token cookie")]
    TokenCookieDeserialization,

    #[error("GitHub API error: {0}")]
    Api(#[from] octocrab::Error),

    #[error("User not authenticated")]
    NotAuthenticated,

    #[error("GitHub user with id {0} has no email")]
    UserHasNoEmail(UserId),
}

impl IntoResponse for Box<KeaGitHubError> {
    fn into_response(self) -> Response<axum::body::Body> {
        let status = match *self {
            KeaGitHubError::Auth { .. } => axum::http::StatusCode::UNAUTHORIZED,
            _ => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        };

        let body = match *self {
            KeaGitHubError::Auth {
                error_description,
                error_url,
                error,
                ..
            } => format!("{}: {}\n{}", error, error_description, error_url),

            KeaGitHubError::Api(e) => match e {
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
        Box::new(KeaGitHubError::Api(e))
    }
}
