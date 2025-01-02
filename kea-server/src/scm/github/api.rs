use axum_extra::extract::PrivateCookieJar;

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
        let pr = KeaPullRequestDetails::new(pr.id.0, pr.number, pr.title);

        Ok((jar, pr))
    }
}
