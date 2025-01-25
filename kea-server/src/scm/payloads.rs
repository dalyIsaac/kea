use octocrab::models::repos::DiffEntryStatus;
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
    pub head: KeaPullRequestCommit,
    pub base: KeaPullRequestCommit,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaPullRequestCommit {
    pub sha: String,
    pub label: String,
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

impl From<DiffEntryStatus> for KeaDiffEntryStatus {
    fn from(status: DiffEntryStatus) -> Self {
        match status {
            DiffEntryStatus::Added => KeaDiffEntryStatus::Added,
            DiffEntryStatus::Removed => KeaDiffEntryStatus::Removed,
            DiffEntryStatus::Modified => KeaDiffEntryStatus::Modified,
            DiffEntryStatus::Renamed => KeaDiffEntryStatus::Renamed,
            DiffEntryStatus::Copied => KeaDiffEntryStatus::Copied,
            DiffEntryStatus::Changed => KeaDiffEntryStatus::Changed,
            DiffEntryStatus::Unchanged => KeaDiffEntryStatus::Unchanged,
            _ => KeaDiffEntryStatus::Unchanged,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaDiffEntry {
    pub sha: String,
    pub status: KeaDiffEntryStatus,
    pub additions: u64,
    pub deletions: u64,
    pub changes: u64,
    pub original_filename: Option<String>,
    pub current_filename: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaCommit {
    pub sha: String,
    pub message: String,
    pub author: Option<ScmUser>,
    pub committer: Option<ScmUser>,
    pub parents: Vec<KeaParentCommit>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaParentCommit {
    pub sha: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub enum KeaPullRequestReviewCommentSide {
    Left,
    Right,
}

#[allow(clippy::too_many_arguments)]
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaPullRequestReviewTimelineComment {
    pub id: u64,
    pub user: Option<ScmUser>,
    pub body: String,
    pub commit_id: String,
    pub path: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,

    /// The line of the PR's final commit to which the commit applies. The first line of the range for a multi-line comment.
    pub start_line: Option<u64>,

    /// The line of the PR's final commit to which the commit applies. The last line of the range for a multi-line comment.
    pub line: Option<u64>,

    /// The line of the blob to which the comment applies. The first line of the range for a multi-line comment.
    pub original_start_line: Option<u64>,

    /// The line of the blob to which the comment applies. The last line of the range for a multi-line comment.
    pub original_line: Option<u64>,

    /// The side of the first line of the range for a multi-line comment.
    pub start_side: Option<KeaPullRequestReviewCommentSide>,

    /// The side of the diff to which the comment applies. The side of the last line of the range for a multi-line comment.
    pub side: Option<KeaPullRequestReviewCommentSide>,

    /// The hunk of the diff to which the comment applies.
    pub diff_hunk: String,
}
