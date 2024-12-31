use std::env;

use axum::extract::FromRef;
use axum_extra::extract::cookie::Key;

use crate::scm::github::client::GitHubClient;
use crate::scm::scm_client::ScmClient;

#[derive(Clone)]
pub struct AppClients {
    pub github: GitHubClient,
}

#[derive(Clone)]
pub struct AppContext {
    pub domain: String,
    pub port: u16,
    pub cors_allowed_origin: String,
    pub cookie_timeout_secs: u64,
    pub key: Key,
}

impl AppContext {
    pub fn get_server_url(&self) -> String {
        format!("{}:{}", self.domain, self.port)
    }
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
        let domain = env::var("DOMAIN").expect("DOMAIN must be set");

        let port = env::var("PORT")
            .expect("PORT must be set")
            .parse::<u16>()
            .expect("Invalid port");

        let cors_allowed_origin =
            env::var("CORS_ALLOWED_ORIGIN").expect("CORS_ALLOWED_ORIGIN must be set");

        let cookie_timeout_secs = env::var("TIMEOUT_SECS")
            .expect("TIMEOUT_SECS must be set")
            .parse::<u64>()
            .expect("Invalid timeout seconds");

        let key = Key::from(
            env::var("COOKIE_HEX_KEY")
                .expect("COOKIE_HEX_KEY must be set")
                .as_bytes(),
        );

        AppState {
            clients: AppClients {
                github: GitHubClient::new(),
            },
            ctx: AppContext {
                domain,
                port,
                cors_allowed_origin,
                cookie_timeout_secs,
                key,
            },
        }
    }
}
