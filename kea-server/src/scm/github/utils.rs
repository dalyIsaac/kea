use octocrab::models::{
    pulls,
    repos::{DiffEntry, RepoCommit},
    Author,
};

use crate::scm::{
    payloads::{
        KeaCommit, KeaDiffEntry, KeaParentCommit, KeaPullRequestReviewComment,
        KeaPullRequestReviewCommentPosition, KeaPullRequestReviewCommentSide,
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

impl From<String> for KeaPullRequestReviewCommentSide {
    fn from(side: String) -> Self {
        match side.as_str() {
            "LEFT" => KeaPullRequestReviewCommentSide::Left,
            "RIGHT" => KeaPullRequestReviewCommentSide::Right,
            _ => KeaPullRequestReviewCommentSide::Right,
        }
    }
}

impl From<pulls::Comment> for KeaPullRequestReviewComment {
    fn from(comment: pulls::Comment) -> Self {
        // The line of the PR's final commit to which the commit applies. The first line of the range for a multi-line comment.
        let start_line = comment.start_line;

        // The line of the PR's final commit to which the commit applies. The last line of the range for a multi-line comment.
        let line = comment.line;

        // The line of the blob to which the comment applies. The first line of the range for a multi-line comment.
        let original_start_line = comment.original_start_line;

        // The line of the blob to which the comment applies. The last line of the range for a multi-line comment.
        let original_line = comment.original_line;

        // The side of the first line of the range for a multi-line comment.
        let start_side = comment.start_side;

        // The side of the diff to which the comment applies. The side of the last line of the range for a multi-line comment.
        let end_side = comment.side;

        println!(
            "\n\nbody: {:?}",
            &comment.body.chars().take(50).collect::<String>()
        );
        println!("start_line: {:?}", start_line);
        println!("start_side: {:?}", start_side);
        println!("end_line: {:?}", line);
        println!("end_side: {:?}", end_side);
        println!("original_start_line: {:?}", original_start_line);
        println!("original_line: {:?}", original_line);
        println!("diff hunk: {:?}", comment.diff_hunk);

        let start_position = match (start_line, start_side) {
            (Some(start_line), Some(start_side)) => Some(KeaPullRequestReviewCommentPosition::new(
                start_line,
                start_side.into(),
            )),
            _ => None,
        };

        let end_position = match (line, end_side) {
            (Some(end_line), Some(end_side)) => Some(KeaPullRequestReviewCommentPosition::new(
                end_line,
                end_side.into(),
            )),
            _ => None,
        };

        KeaPullRequestReviewComment::new(
            comment.id.0,
            comment.user.map(|user| user.into()),
            comment.body,
            comment.commit_id,
            comment.path,
            comment.created_at,
            comment.updated_at,
            start_position,
            end_position,
        )
    }
}
