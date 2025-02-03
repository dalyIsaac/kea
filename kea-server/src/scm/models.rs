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

    /// The head commit of the PR - the commit that is being merged into the base branch.
    pub head: KeaPullRequestCommit,

    /// The base commit of the PR - the commit that the head commit is being merged into.
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
    Original,
    Modified,
}

#[allow(clippy::too_many_arguments)]
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize, derive_new::new, utoipa::ToSchema)]
pub struct KeaPullRequestReviewComment {
    pub id: u64,
    pub user: Option<ScmUser>,
    pub body: String,
    pub path: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,

    /// The SHA of the final commit to which the comment applies.
    pub commit_id: String,

    /// The SHA of the original commit to which the comment applies.
    pub original_commit_id: String,

    /// The start line number on the file to which the comment applies.
    /// The first line of the range for a multi-line comment.
    pub start_line: Option<u64>,

    /// The line in the file to which this thread refers.
    /// The last line of the range for a multi-line comment.
    pub line: Option<u64>,

    /// The start line number on the file to which the comment applied when it was first created.
    /// The first line of the range for a multi-line comment.
    pub original_start_line: Option<u64>,

    /// The original line in the file to which this thread refers.
    /// The last line of the range for a multi-line comment.
    pub original_line: Option<u64>,

    /// The side of the diff on which the start line resides.
    /// The side of the first line of the range for a multi-line comment.
    pub start_side: Option<KeaPullRequestReviewCommentSide>,

    /// The side of the diff on which the start line resides.
    /// The side of the last line of the range for a multi-line comment.
    pub side: Option<KeaPullRequestReviewCommentSide>,

    /// The hunk of the diff to which the comment applies.
    pub diff_hunk: String,
}
