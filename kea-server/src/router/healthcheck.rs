use axum::response::IntoResponse;
use axum::response::Response;

#[axum::debug_handler]
#[utoipa::path(get, path = "/healthcheck", responses((status = OK, body = String)))]
pub async fn healthcheck() -> Response {
    "OK".into_response()
}
