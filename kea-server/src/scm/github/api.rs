use axum_extra::extract::PrivateCookieJar;
use kea_server::try_chain;

use crate::{
    scm::{
        payloads::{KeaCommit, KeaPullRequestCommit, KeaPullRequestDetails},
        scm_client::ScmApiClient,
    },
    state::AppContext,
};

use super::{client::GitHubClient, error::KeaGitHubError};

const COMMIT_PAGE_SIZE: u8 = 250;

impl ScmApiClient<Box<KeaGitHubError>> for GitHubClient {
    async fn get_pull_request_details(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
        owner: &str,
        repo: &str,
        pr_number: u64,
    ) -> Result<(PrivateCookieJar, KeaPullRequestDetails), Box<KeaGitHubError>> {
        let (jar, client) = self.get_client_with_token(jar, ctx).await?;
        let pr = client.pulls(owner, repo).get(pr_number).await?;

        let pr_base = pr.base.as_ref().clone();

        let head_label = pr
            .head
            .label
            .ok_or(KeaGitHubError::PullRequestCommitHasNoLabel(
                pr.head.sha.clone(),
            ))?;
        let base_label = pr_base
            .label
            .ok_or(KeaGitHubError::PullRequestCommitHasNoLabel(
                pr_base.sha.clone(),
            ))?;

        let head = KeaPullRequestCommit::new(pr.head.sha, head_label);
        let base = KeaPullRequestCommit::new(pr_base.sha, base_label);

        let pr = KeaPullRequestDetails::new(
            pr.id.0,
            try_chain!(pr.base.user => login).unwrap_or(owner.to_string()),
            try_chain!(pr_base.repo => name).unwrap_or(repo.to_string()),
            pr.number,
            pr.title,
            pr.body,
            head,
            base,
        );

        Ok((jar, pr))
    }

    async fn get_pull_request_commits(
        &self,
        jar: PrivateCookieJar,
        ctx: &AppContext,
        owner: &str,
        repo: &str,
        pr_number: u64,
    ) -> Result<(PrivateCookieJar, Vec<KeaCommit>), Box<KeaGitHubError>> {
        let (jar, client) = self.get_client_with_token(jar, ctx).await?;
        let commits = client
            .pulls(owner, repo)
            .pr_commits(pr_number)
            .per_page(COMMIT_PAGE_SIZE)
            .send()
            .await?;

        Ok((jar, commits.into_iter().map(Into::into).collect()))
    }
}
