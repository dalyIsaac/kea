use axum::{routing::get, Router};
use client::{github::GitHubClient, scm_client::ScmClient};

mod client;
mod error;
mod router;

#[derive(Clone)]
pub struct AppState {
    github_client: GitHubClient,
}

#[tokio::main]
async fn main() {
    let state = AppState {
        github_client: GitHubClient::new(),
    };

    let app = Router::new()
        .route("/login/github", get(router::authentication::github::login))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
