use crate::scm::github::error::KeaGitHubError;
use crate::scm::models::{
    KeaCommit, KeaDiffEntry, KeaPullRequestDetails, KeaPullRequestReviewComment,
};
use crate::scm::scm_client::{AuthResponse, ScmApiClient, ScmAuthClient};
use crate::state::AppState;
use axum::extract::Path;
use axum::response::IntoResponse;
use axum::Json;
use axum::{extract::State, response::Response};
use axum_extra::extract::cookie::PrivateCookieJar;

#[axum::debug_handler]
#[utoipa::path(get, path = "/github/signin", responses((status = OK, body = String)))]
pub async fn sign_in(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    auth_response: Option<AuthResponse>,
) -> Result<Response, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;
    clients.github.sign_in(auth_response, jar, &ctx).await
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

#[axum::debug_handler]
#[utoipa::path(
    get,
    path = "/github/{owner}/{repo}/file/{git_ref}/{path}",
    responses((status = OK, body = String)),
    params(
        ("owner" = String, Path, description = "Owner of the repository"),
        ("repo" = String, Path, description = "Repository name"),
        ("git_ref" = String, Path, description = "Git reference"),
        ("path" = String, Path, description = "Path to the file")
    )
)]
pub async fn get_file_content(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path((owner, repo, git_ref, path)): Path<(String, String, String, String)>,
) -> Result<impl IntoResponse, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;

    match clients
        .github
        .get_file_content(jar, &ctx, &owner, &repo, &git_ref, &path)
        .await
    {
        Ok((new_jar, content)) => Ok((new_jar, content)),
        Err(e) => Err(e),
    }
}

#[axum::debug_handler]
#[utoipa::path(
    get,
    path = "/github/{owner}/{repo}/pull/{pr_number}/files",
    params(
        ("owner" = String, Path, description = "Owner of the repository"),
        ("repo" = String, Path, description = "Repository name"),
        ("pr_number" = u64, Path, description = "Pull request number")
    ),
    responses((status = OK, body = Vec<KeaDiffEntry>))
)]
pub async fn get_pull_request_files(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path((owner, repo, pr_number)): Path<(String, String, u64)>,
) -> Result<impl IntoResponse, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;

    match clients
        .github
        .get_pull_request_files(jar, &ctx, &owner, &repo, pr_number)
        .await
    {
        Ok((new_jar, files)) => Ok((new_jar, Json(files))),
        Err(e) => Err(e),
    }
}

#[axum::debug_handler]
#[utoipa::path(
    get,
    path = "/github/{owner}/{repo}/pull/{pr_number}/comments",
    params(
        ("owner" = String, Path, description = "Owner of the repository"),
        ("repo" = String, Path, description = "Repository name"),
        ("pr_number" = u64, Path, description = "Pull request number")
    ),
    responses((status = OK, body = Vec<KeaPullRequestReviewComment>))
)]
pub async fn get_pull_request_review_comments(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Path((owner, repo, pr_number)): Path<(String, String, u64)>,
) -> Result<impl IntoResponse, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;

    match clients
        .github
        .get_pull_request_review_comments(jar, &ctx, &owner, &repo, pr_number)
        .await
    {
        Ok((new_jar, comments)) => Ok((new_jar, Json(comments))),
        Err(e) => Err(e),
    }
}
