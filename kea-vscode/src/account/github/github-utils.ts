import { RestEndpointMethodTypes } from "@octokit/rest";
import { IssueComment, PullRequest, PullRequestComment, PullRequestFile } from "../../types/kea";

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
  isDraft: pr.draft ?? false,
  repository: {
    name: pr.base.repo.name,
    owner: pr.base.repo.owner.login,
    url: pr.base.repo.html_url,
  },
  user: {
    login: pr.user?.login ?? "",
    avatarUrl: pr.user?.avatar_url ?? "",
  },
});

/**
 * Converts an Octokit Issue Comment response to our internal IssueComment type.
 */
export const convertGitHubIssueComment = (
  comment: RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"][number],
): IssueComment => ({
  id: comment.id,
  body: comment.body ?? null,
  createdAt: new Date(comment.created_at),
  updatedAt: new Date(comment.updated_at),
  replyTo: null,
  user: {
    login: comment.user?.login ?? "",
    avatarUrl: comment.user?.avatar_url ?? "",
  },
});

/**
 * Converts an Octokit Pull Request Review Comment response to our internal PullRequestComment type
 */
export const convertGitHubPullRequestComment = (
  comment: RestEndpointMethodTypes["pulls"]["listReviewComments"]["response"]["data"][number],
): PullRequestComment => ({
  id: comment.id,
  body: comment.body,
  createdAt: new Date(comment.created_at),
  updatedAt: new Date(comment.updated_at),
  replyTo: comment.in_reply_to_id ?? null,
  path: comment.path,
  startLine: comment.start_line ?? null,
  originalStartLine: comment.original_start_line ?? null,
  startSide: comment.start_side ?? null,
  line: comment.line ?? null,
  originalLine: comment.original_line ?? null,
  side: comment.side ?? null,
  user: {
    login: comment.user.login,
    avatarUrl: comment.user.avatar_url,
  },
});

/**
 * Converts an Octokit Pull Request File response to our internal PullRequestFile type
 */
export const convertGitHubPullRequestFile = (
  file: RestEndpointMethodTypes["pulls"]["listFiles"]["response"]["data"][number],
): PullRequestFile => ({
  filename: file.filename,
  sha: file.sha,
  status: file.status,
  additions: file.additions,
  deletions: file.deletions,
  changes: file.changes,
  blobUrl: file.blob_url,
  rawUrl: file.raw_url,
  contentsUrl: file.contents_url,
  patch: file.patch ?? null,
});
