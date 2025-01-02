use derive_new::new;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, new, utoipa::ToSchema)]
pub struct KeaPullRequestDetails {
    pub id: u64,
    pub number: u64,
    pub title: Option<String>,
}
