use octocrab::models::{
    pulls,
    repos::{DiffEntry, RepoCommit},
    Author,
};

use crate::scm::{
    payloads::{
        KeaCommit, KeaDiffEntry, KeaParentCommit, KeaPullRequestReviewCommentSide,
        KeaPullRequestReviewTimelineComment,
    },
    scm_client::ScmUser,
};

impl From<RepoCommit> for KeaCommit {
    fn from(commit: RepoCommit) -> Self {
        KeaCommit::new(
            commit.sha,
            commit.commit.message,
            commit.author.map(Into::into),
            commit.committer.map(Into::into),
            commit
                .parents
                .into_iter()
                .filter_map(|p| p.sha)
                .map(KeaParentCommit::new)
                .collect(),
        )
    }
}

impl From<Author> for ScmUser {
    fn from(author: octocrab::models::Author) -> Self {
        ScmUser::new(
            author.id.to_string(),
            author.login,
            author.avatar_url.to_string(),
        )
    }
}

impl From<DiffEntry> for KeaDiffEntry {
    fn from(entry: DiffEntry) -> Self {
        KeaDiffEntry::new(
            entry.sha,
            entry.status.into(),
            entry.additions,
            entry.deletions,
            entry.changes,
            entry.previous_filename,
            entry.filename,
        )
    }
}

fn to_side(side: Option<String>) -> Option<KeaPullRequestReviewCommentSide> {
    match side {
        Some(side) => match side.as_str() {
            "LEFT" => Some(KeaPullRequestReviewCommentSide::Left),
            "RIGHT" => Some(KeaPullRequestReviewCommentSide::Right),
            _ => None,
        },
        None => None,
    }
}

impl From<pulls::Comment> for KeaPullRequestReviewTimelineComment {
    fn from(comment: pulls::Comment) -> Self {
        KeaPullRequestReviewTimelineComment::new(
            comment.id.0,
            comment.user.map(|user| user.into()),
            comment.body,
            comment.commit_id,
            comment.path,
            comment.created_at,
            comment.updated_at,
            comment.start_line,
            comment.line,
            comment.original_start_line,
            comment.original_line,
            to_side(comment.start_side),
            to_side(comment.side),
            comment.diff_hunk,
        )
    }
}
