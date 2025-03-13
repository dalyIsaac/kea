import { RestEndpointMethodTypes } from "@octokit/rest";
import { PullRequest, PullRequestComment } from "../../types/kea";

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

/**
 * Converts an Octokit Pull Request Comment response to our internal PullRequestComment type
 */
export const convertGitHubPullRequestComment = (
  comment: RestEndpointMethodTypes["pulls"]["listReviewComments"]["response"]["data"][number],
): PullRequestComment => ({
  id: comment.id,
  body: comment.body,
  createdAt: new Date(comment.created_at),
  updatedAt: new Date(comment.updated_at),
  replyTo: comment.in_reply_to_id || null,
  startLine: comment.start_line || 0,
  originalStartLine: comment.original_start_line || 0,
  startSide: comment.start_side as "LEFT" | "RIGHT",
  line: comment.line || 0,
  originalLine: comment.original_line || 0,
  side: comment.side as "LEFT" | "RIGHT",
  user: {
    login: comment.user?.login || "",
    avatarUrl: comment.user?.avatar_url || "",
  },
});
