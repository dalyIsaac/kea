use axum::http::header::CONTENT_TYPE;
use axum::http::{header, HeaderName, Uri};
use axum::{routing::get, Router};
use client::github::GITHUB_LOGIN_URI;
use client::{github::GitHubClient, scm_client::ScmClient};
use std::str::FromStr;
use std::time::Duration;
use tower_http::catch_panic::CatchPanicLayer;
use tower_http::request_id::{PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::{sensitive_headers::SetSensitiveRequestHeadersLayer, trace::TraceLayer};

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

    let timeout_secs = std::env::var("TIMEOUT_SECS")
        .expect("TIMEOUT_SECS must be set")
        .parse::<u64>()
        .expect("Invalid timeout seconds");

    let state = AppState {
        github_client: GitHubClient::new(),
        base_url,
    };

    let x_request_id = HeaderName::from_static("x-request-id");

    let app = Router::new()
        .route("/", get(|| async { "Hello, world!" }))
        .route(GITHUB_LOGIN_URI, get(router::authentication::github::login))
        .with_state(state)
        .layer(
            tower::ServiceBuilder::new()
                // Don't log sensitive headers.
                .layer(SetSensitiveRequestHeadersLayer::new([
                    header::AUTHORIZATION,
                    header::COOKIE,
                ]))
                // High level logging of requests and responses
                .layer(TraceLayer::new_for_http())
                // Give every request a unique `x-request-id` header.
                .layer(SetRequestIdLayer::new(
                    x_request_id.clone(),
                    router::middleware::request_id::MakeKeaRequestId,
                ))
                // Propagate `x-request-id` header from requests to responses.
                .layer(PropagateRequestIdLayer::new(x_request_id.clone()))
                .layer(TimeoutLayer::new(Duration::from_secs(timeout_secs)))
                // If the response has a known size set the `Content-Length` header
                .layer(SetResponseHeaderLayer::overriding(
                    CONTENT_TYPE,
                    router::middleware::utils::content_length_from_response,
                ))
                // Catch panics and return a 500 Internal Server Error.
                .layer(CatchPanicLayer::new()),
        );

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
