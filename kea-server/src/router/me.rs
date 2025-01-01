use crate::scm::github::error::KeaGitHubError;
use crate::scm::scm_client::{ScmClient, ScmUser};
use crate::state::AppState;
use axum::extract::State;
use axum::response::IntoResponse;
use axum::Json;
use axum_extra::extract::cookie::PrivateCookieJar;
use serde::Serialize;
use tracing::error;

#[derive(Debug, Serialize, utoipa::ToSchema)]
struct MeClients {
    github: Option<ScmUser>,
}

#[axum::debug_handler]
#[utoipa::path(get, path = "/me", responses((status = OK, body = MeClients)))]
pub async fn me(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
) -> Result<impl IntoResponse, Box<KeaGitHubError>> {
    let AppState { clients, ctx } = state;

    let mut jar = jar;

    let github_user = match clients.github.get_cookie_user(jar.clone(), ctx).await {
        Ok((new_jar, new_user)) => {
            jar = new_jar;
            Some(new_user)
        }
        Err(e) => {
            error!("Error getting github user: {:?}", e);
            None
        }
    };

    let me = MeClients {
        github: github_user,
    };

    Ok((jar, Json(me)))
}
