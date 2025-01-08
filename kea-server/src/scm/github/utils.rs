use octocrab::models::{repos::RepoCommit, Author};

use crate::scm::{
    payloads::{KeaCommit, KeaParentCommit},
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
                .map(|sha| KeaParentCommit::new(sha))
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
