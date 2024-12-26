use axum::{body::HttpBody, http::HeaderValue};

pub fn content_length_from_response<B>(res: &axum::http::Response<B>) -> Option<HeaderValue>
where
    B: HttpBody,
{
    res.body()
        .size_hint()
        .exact()
        .map(|size| HeaderValue::from_str(&size.to_string()).unwrap())
}
