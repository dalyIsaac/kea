use std::convert::Infallible;

use axum::{
    extract::{FromRequestParts, OptionalFromRequestParts, Query},
    http::request::Parts,
    response::{IntoResponse, Redirect, Response},
};
use axum_extra::extract::PrivateCookieJar;
use serde::{de, Deserialize, Deserializer, Serialize};

use crate::state::{AppContext, AppState};

use super::payloads::{
    KeaCommit, KeaDiffEntry, KeaPullRequestDetails, KeaPullRequestReviewTimelineComment,
};

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

pub struct AuthRedirect;

impl IntoResponse for AuthRedirect {
    fn into_response(self) -> Response {
        Redirect::temporary("/github/signin").into_response()
    }
}

impl FromRequestParts<AppState> for AuthResponse {
    type Rejection = AuthRedirect;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        Query::<AuthResponse>::from_request_parts(parts, state)
            .await
            .map(|query| query.0)
            .map_err(|_| AuthRedirect)
    }
}

impl OptionalFromRequestParts<AppState> for AuthResponse {
    type Rejection = Infallible;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Option<Self>, Self::Rejection> {
        Ok(Query::<AuthResponse>::from_request_parts(parts, state)
            .await
            .ok()
            .map(|query| query.0))
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize, utoipa::ToSchema, derive_new::new)]
pub struct ScmUser {
    /// The user's unique ID.
    pub id: String,

    /// The user's login. This is typically the user's username.
    pub login: String,

    /// The user's display name.
    pub avatar_url: String,
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
        auth_response: Option<AuthResponse>,
        jar: PrivateCookieJar,
        state: &AppContext,
    ) -> Result<Response, E>;

    async fn sign_out(&self, jar: PrivateCookieJar, state: &AppContext) -> Result<Response, E>;

    /// Get the user associated with the cookie in the given jar.
    async fn get_cookie_user(
        &self,
        jar: PrivateCookieJar,
        state: &AppContext,
    ) -> Result<(PrivateCookieJar, ScmUser), E>;
}

pub trait ScmApiClient<E> {
    async fn get_pull_request_details(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
        owner: &str,
        repo: &str,
        pr_number: u64,
    ) -> Result<(PrivateCookieJar, KeaPullRequestDetails), E>;

    async fn get_pull_request_commits(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
        owner: &str,
        repo: &str,
        pr_number: u64,
    ) -> Result<(PrivateCookieJar, Vec<KeaCommit>), E>;

    async fn get_file_content(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
        owner: &str,
        repo: &str,
        git_ref: &str,
        path: &str,
    ) -> Result<(PrivateCookieJar, String), E>;

    async fn get_pull_request_files(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
        owner: &str,
        repo: &str,
        pr_number: u64,
    ) -> Result<(PrivateCookieJar, Vec<KeaDiffEntry>), E>;

    async fn get_pull_request_timeline_review_comments(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
        owner: &str,
        repo: &str,
        pr_number: u64,
    ) -> Result<(PrivateCookieJar, Vec<KeaPullRequestReviewTimelineComment>), E>;
}
