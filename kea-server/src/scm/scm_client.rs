use axum::{extract::Query, response::Response};
use axum_extra::extract::PrivateCookieJar;
use serde::{de, Deserialize, Deserializer, Serialize};

use crate::state::AppContext;

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

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct ScmUser {
    /// The user's unique ID.
    pub id: String,

    /// The user's login. This is typically the user's username.
    pub login: String,
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

pub trait ScmAuthClient<E> {
    async fn sign_in(
        &self,
        query: Option<Query<AuthResponse>>,
        jar: PrivateCookieJar,
        state: AppContext,
    ) -> Result<Response, E>;

    async fn sign_out(&self, jar: PrivateCookieJar, state: AppContext) -> Result<Response, E>;

    /// Get the user associated with the cookie in the given jar.
    async fn get_cookie_user(
        &self,
        jar: PrivateCookieJar,
        state: AppContext,
    ) -> Result<(PrivateCookieJar, ScmUser), E>;
}

pub trait ScmClient<E> {
    async fn get_pull_request_details(
        &self,
        owner: &str,
        repo: &str,
        pr_number: u64,
    ) -> Result<(), E>;
}
