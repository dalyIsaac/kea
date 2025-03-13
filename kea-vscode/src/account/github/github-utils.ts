import { RestEndpointMethodTypes } from "@octokit/rest";
import { PullRequest } from "../../types/kea";

/**
 * Converts an Octokit Pull Request response to our internal PullRequest type
 */
export const convertGitHubPullRequest = (pr: RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][number]): PullRequest => ({
  id: pr.id,
  number: pr.number,
  title: pr.title,
  state: pr.state,
  url: pr.html_url,
  createdAt: new Date(pr.created_at),
  updatedAt: new Date(pr.updated_at),
  closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
  mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
  isDraft: pr.draft || false,
  repository: {
    name: pr.base?.repo?.name || "",
    owner: pr.base?.repo?.owner?.login || "",
    url: pr.base?.repo?.html_url || "",
  },
  user: {
    login: pr.user?.login || "",
    avatarUrl: pr.user?.avatar_url || "",
  },
});
