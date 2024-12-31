use utoipa::openapi::security::{ApiKey, ApiKeyValue, SecurityScheme};
use utoipa::{Modify, OpenApi};
use utoipa_axum::router::OpenApiRouter;

use crate::scm::github::client::GITHUB_COOKIE;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Kea",
        description = "API documentation for the Kea server.",
        license(),
    ),
    modifiers(&SecurityAddon),
)]
pub struct BaseOpenApi;

impl BaseOpenApi {
    pub fn router<S>() -> OpenApiRouter<S>
    where
        S: Send + Sync + Clone + 'static,
    {
        OpenApiRouter::with_openapi(Self::openapi())
    }
}

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi.components.get_or_insert_default();

        let description = "The GitHub cookie is used to authenticate requests from GitHub.";
        let cookie = ApiKey::Cookie(ApiKeyValue::with_description(GITHUB_COOKIE, description));
        components.add_security_scheme("cookie", SecurityScheme::ApiKey(cookie));
    }
}
