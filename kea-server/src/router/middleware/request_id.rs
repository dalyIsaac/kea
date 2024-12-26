use axum::http::HeaderValue;
use tower_http::request_id::{MakeRequestId, RequestId};

#[derive(Clone, Default)]
pub struct MakeKeaRequestId;

impl MakeRequestId for MakeKeaRequestId {
    fn make_request_id<B>(&mut self, _request: &axum::http::Request<B>) -> Option<RequestId> {
        Some(RequestId::new(
            HeaderValue::from_str(&uuid::Uuid::new_v4().to_string()).unwrap(),
        ))
    }
}
