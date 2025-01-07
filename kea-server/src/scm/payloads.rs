use octocrab::models::pulls::{Base, Head};
use serde::{Deserialize, Serialize};

use super::scm_client::ScmUser;

#[allow(clippy::too_many_arguments)]
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaPullRequestDetails {
    pub id: u64,
    pub owner: String,
    pub repo: String,
    pub number: u64,
    pub title: Option<String>,
    pub body: Option<String>,
    pub head: KeaCommitRef,
    pub base: KeaCommitRef,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub enum KeaDiffEntryStatus {
    Added,
    Removed,
    Modified,
    Renamed,
    Copied,
    Changed,
    Unchanged,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaDiffEntry {
    pub sha: String,
    pub filename: String,
    pub status: KeaDiffEntryStatus,
    pub additions: u64,
    pub deletions: u64,
    pub changes: u64,
    pub previous_filename: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaCommit {
    pub sha: String,
    pub message: String,
    pub author: Option<ScmUser>,
    pub committer: Option<ScmUser>,
    pub parents: Vec<KeaCommitRef>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaCommitRef {
    pub sha: String,
    pub label: Option<String>,
}

impl From<Head> for KeaCommitRef {
    fn from(head: Head) -> Self {
        Self {
            sha: head.sha,
            label: head.label,
        }
    }
}

impl From<Base> for KeaCommitRef {
    fn from(base: Base) -> Self {
        Self {
            sha: base.sha,
            label: base.label,
        }
    }
}
