use axum_extra::extract::PrivateCookieJar;
use kea_server::try_chain;

use crate::{
    scm::{payloads::KeaPullRequestDetails, scm_client::ScmApiClient},
    state::AppContext,
};

use super::{client::GitHubClient, error::KeaGitHubError};

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

        let pr = KeaPullRequestDetails::new(
            try_chain!(pr.base.user => login).unwrap_or(owner.to_string()),
            try_chain!(pr.base.repo => name).unwrap_or(repo.to_string()),
            pr.id.0,
            pr.number,
            pr.title,
            pr.body,
        );

        Ok((jar, pr))
    }
}
