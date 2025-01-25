use axum::http::{header, HeaderName, HeaderValue};
use openapi::BaseOpenApi;
use state::AppState;
use std::time::Duration;
use tower_http::catch_panic::CatchPanicLayer;
use tower_http::cors::CorsLayer;
use tower_http::request_id::{PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::timeout::TimeoutLayer;
use tower_http::{sensitive_headers::SetSensitiveRequestHeadersLayer, trace::TraceLayer};
use utoipa_axum::routes;
use utoipa_swagger_ui::SwaggerUi;

mod openapi;
mod router;
mod scm;
mod state;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().expect("Failed to load .env file");
    let state = AppState::new().await;

    let base_url = format!("0.0.0.0:{}", state.ctx.port);
    let client_url = state.ctx.client_url.clone();
    let timeout_secs = state.ctx.cookie_timeout_secs;
    let x_request_id = HeaderName::from_static("x-request-id");

    let (router, openapi) = BaseOpenApi::router()
        .routes(routes!(router::me::me))
        .routes(routes!(router::github::sign_in))
        .routes(routes!(router::github::sign_out))
        .routes(routes!(router::github::get_pull_request_details))
        .routes(routes!(router::github::get_pull_request_commits))
        .routes(routes!(router::github::get_pull_request_files))
        .routes(routes!(
            router::github::get_pull_request_timeline_review_comments
        ))
        .routes(routes!(router::github::get_file_content))
        .routes(routes!(router::healthcheck::healthcheck))
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
                // CORS
                .layer(
                    CorsLayer::new()
                        .allow_origin(client_url.parse::<HeaderValue>().unwrap())
                        .allow_credentials(true),
                )
                // Catch panics and return a 500 Internal Server Error.
                .layer(CatchPanicLayer::new()),
        )
        .split_for_parts();

    let router = router.merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", openapi));

    let listener = tokio::net::TcpListener::bind(base_url).await.unwrap();

    axum::serve(listener, router).await.unwrap();
}
