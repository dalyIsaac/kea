use axum::http::Uri;
use axum::{routing::get, Router};
use client::github::GITHUB_LOGIN_URI;
use client::{github::GitHubClient, scm_client::ScmClient};
use std::str::FromStr;

mod client;
mod error;
mod router;

#[derive(Clone)]
pub struct AppState {
    github_client: GitHubClient,
    base_url: Uri,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().expect("Failed to load .env file");

    let base_url = Uri::from_str(
        std::env::var("BASE_URL")
            .expect("BASE_URL must be set")
            .trim_end_matches('/'),
    )
    .expect("Invalid base URL");

    let state = AppState {
        github_client: GitHubClient::new(),
        base_url,
    };

    let app = Router::new()
        .route("/", get(|| async { "Hello, world!" }))
        .route(GITHUB_LOGIN_URI, get(router::authentication::github::login))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
