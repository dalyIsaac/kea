import { RestEndpointMethodTypes } from "@octokit/rest";
import { IssueComment, PullRequest, PullRequestComment, PullRequestCommit, PullRequestFile } from "../../types/kea";

/**
 * Converts an Octokit Pull Request List item response to our internal PullRequest type.
 */
export const convertGitHubPullRequestListItem = (
  pr: RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][number],
): PullRequest => ({
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
 * Converts an Octokit Pull Request response to our internal PullRequest type.
 */
export const convertGitHubPullRequest = (pr: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"]): PullRequest => ({
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
    login: pr.user.login,
    avatarUrl: pr.user.avatar_url,
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
export const convertGitHubPullRequestReviewComment = (
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
 * Converts an Octokit Pull Request File response to our internal PullRequestFile type.
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

/**
 * Converts an Octokit Pull Request Commit response to our internal PullRequestCommit type.
 */
export const convertGitHubPullRequestCommit = (
  commit: RestEndpointMethodTypes["pulls"]["listCommits"]["response"]["data"][number],
): PullRequestCommit => ({
  sha: commit.sha,
  commit: {
    author: commit.commit.author,
    committer: commit.commit.committer,
    message: commit.commit.message,
    commentCount: commit.commit.comment_count,
    tree: {
      sha: commit.commit.tree.sha,
      url: commit.commit.tree.url,
    },
  },
  ...(commit.stats
    ? {
        stats: {
          total: commit.stats.total,
          additions: commit.stats.additions,
          deletions: commit.stats.deletions,
        },
      }
    : {}),
  files: commit.files ? commit.files.map(convertGitHubPullRequestFile) : [],
  url: commit.html_url,
});
