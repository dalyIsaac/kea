use crate::scm::github::error::KeaGitHubError;
use crate::scm::scm_client::ScmClient;
use crate::state::AppState;
use axum::body::Body;
use axum::response::IntoResponse;
use axum::{extract::State, response::Response};
use axum_extra::extract::cookie::PrivateCookieJar;

#[axum::debug_handler]
#[utoipa::path(get, path = "/me", responses((status = OK, body = String)))]
pub async fn me(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
) -> Result<Response, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;

    match clients.github.get_cookie_user(jar, ctx).await {
        Ok((jar, user)) => {
            let body = Body::from(serde_json::to_string(&user).unwrap());
            Ok((jar, body).into_response())
        }
        Err(e) => Err(e),
    }
}
