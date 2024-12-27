use std::{env, str::FromStr};

use axum::{extract::FromRef, http::Uri};
use axum_extra::extract::cookie::Key;

use crate::scm::github::client::GitHubClient;
use crate::scm::scm_client::ScmClient;

#[derive(Clone)]
pub struct AppClients {
    pub github: GitHubClient,
}

#[derive(Clone)]
pub struct AppContext {
    pub base_url: Uri,
    pub key: Key,
    pub cookie_timeout_secs: u64,
}

#[derive(Clone)]
pub struct AppState {
    pub clients: AppClients,
    pub ctx: AppContext,
}

impl FromRef<AppState> for Key {
    fn from_ref(state: &AppState) -> Self {
        state.ctx.key.clone()
    }
}

impl AppState {
    pub async fn new() -> Self {
        let base_url = Uri::from_str(
            env::var("BASE_URL")
                .expect("BASE_URL must be set")
                .trim_end_matches('/'),
        )
        .expect("Invalid base URL");

        let timeout_secs = env::var("TIMEOUT_SECS")
            .expect("TIMEOUT_SECS must be set")
            .parse::<u64>()
            .expect("Invalid timeout seconds");

        let key = Key::from(
            env::var("COOKIE_KEY")
                .expect("COOKIE_KEY must be set")
                .as_bytes(),
        );

        AppState {
            clients: AppClients {
                github: GitHubClient::new(),
            },
            ctx: AppContext {
                base_url,
                cookie_timeout_secs: timeout_secs,
                key,
            },
        }
    }
}
