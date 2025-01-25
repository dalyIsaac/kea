use octocrab::models::{
    pulls,
    repos::{DiffEntry, RepoCommit},
    Author,
};

use crate::scm::{
    payloads::{
        KeaCommit, KeaDiffEntry, KeaParentCommit, KeaPullRequestReviewComment,
        KeaPullRequestReviewCommentPosition,
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

impl From<pulls::Comment> for KeaPullRequestReviewComment {
    fn from(comment: pulls::Comment) -> Self {
        KeaPullRequestReviewComment::new(
            comment.id.0,
            comment.user.map(|user| user.into()),
            comment.body,
            comment.commit_id,
            comment.path,
            comment.created_at,
            comment.updated_at,
            match (comment.start_line, comment.line) {
                (Some(start_line), Some(end_line)) => Some(
                    KeaPullRequestReviewCommentPosition::new(start_line, end_line),
                ),
                _ => None,
            },
            match (comment.original_start_line, comment.original_line) {
                (Some(original_start_line), Some(original_end_line)) => {
                    Some(KeaPullRequestReviewCommentPosition::new(
                        original_start_line,
                        original_end_line,
                    ))
                }
                _ => None,
            },
        )
    }
}
