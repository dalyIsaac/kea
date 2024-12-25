use axum::{extract::Query, http::Uri, response::Redirect};
use serde::{de, Deserialize, Deserializer};

use crate::error::KeaError;

#[derive(Debug)]
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

impl<'de> Deserialize<'de> for AuthResponse {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        struct Params {
            code: Option<String>,
            error: Option<String>,
            error_description: Option<String>,
            #[serde(rename = "error_uri")]
            error_url: Option<String>,
        }

        let params = Params::deserialize(deserializer)?;

        if let Some(code) = params.code {
            Ok(AuthResponse::Success { code })
        } else if let Some(error) = params.error {
            Ok(AuthResponse::Failure {
                error,
                error_description: params.error_description.unwrap_or_default(),
                error_url: params.error_url.unwrap_or_default(),
            })
        } else {
            Err(de::Error::custom("missing both code and error"))
        }
    }
}

pub trait ScmClient {
    fn new() -> Self;

    async fn login(
        &self,
        query: Option<Query<AuthResponse>>,
        base_url: &Uri,
    ) -> Result<Redirect, KeaError>;

    // TODO: Implement this method
    // async fn logout(&self, query: Option<Query<AuthResponse>>) -> Result<Redirect, KeaError>;
}
