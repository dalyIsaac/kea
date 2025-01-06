use crate::scm::github::error::KeaGitHubError;
use crate::scm::payloads::{KeaCommit, KeaPullRequestDetails};
use crate::scm::scm_client::{AuthResponse, ScmApiClient, ScmAuthClient};
use crate::state::AppState;
use axum::extract::Path;
use axum::response::IntoResponse;
use axum::Json;
use axum::{
    extract::{Query, State},
    response::Response,
};
use axum_extra::extract::cookie::PrivateCookieJar;

#[axum::debug_handler]
#[utoipa::path(get, path = "/github/signin", responses((status = OK, body = String)))]
pub async fn sign_in(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    query: Option<Query<AuthResponse>>,
) -> Result<Response, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;
    clients.github.sign_in(query, jar, &ctx).await
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/github/signout", responses((status = OK, body = String)))]
pub async fn sign_out(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
) -> Result<Response, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;
    clients.github.sign_out(jar, &ctx).await
}

#[axum::debug_handler]
#[utoipa::path(
    get,
    path = "/github/{owner}/{repo}/pull/{pr_number}",
    params(
        ("owner" = String, Path, description = "Owner of the repository"),
        ("repo" = String, Path, description = "Repository name"),
        ("pr_number" = u64, Path, description = "Pull request number")
    ),
    responses((status = OK, body = KeaPullRequestDetails))
)]
pub async fn get_pull_request_details(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path((owner, repo, pr_number)): Path<(String, String, u64)>,
) -> Result<impl IntoResponse, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;

    match clients
        .github
        .get_pull_request_details(jar, &ctx, &owner, &repo, pr_number)
        .await
    {
        Ok((new_jar, pr)) => Ok((new_jar, Json(pr))),
        Err(e) => Err(e),
    }
}

#[axum::debug_handler]
#[utoipa::path(
    get,
    path = "/github/{owner}/{repo}/pull/{pr_number}/commits",
    responses((status = OK, body = Vec<KeaCommit>)),
    params(
        ("owner" = String, Path, description = "Owner of the repository"),
        ("repo" = String, Path, description = "Repository name"),
        ("pr_number" = u64, Path, description = "Pull request number")
    ),
    responses((status = OK, body = Vec<KeaCommit>))
)]
pub async fn get_pull_request_commits(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path((owner, repo, pr_number)): Path<(String, String, u64)>,
) -> Result<impl IntoResponse, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;

    match clients
        .github
        .get_pull_request_commits(jar, &ctx, &owner, &repo, pr_number)
        .await
    {
        Ok((new_jar, commits)) => Ok((new_jar, Json(commits))),
        Err(e) => Err(e),
    }
}
