import { RestEndpointMethodTypes } from "@octokit/rest";
import { Commit, CommitComment, CommitFile, IssueComment, PullRequest, PullRequestComment } from "../../types/kea";

/**
 * Converts an Octokit User response to our internal User type.
 */
export const convertGitHubUser = (user: NonNullable<RestEndpointMethodTypes["issues"]["get"]["response"]["data"]["user"]>) => ({
  name: user.name ?? null,
  login: user.login,
  email: user.email ?? null,
});

/**
 * Converts an Octokit Git User response to our internal GitUser type.
 */
export const convertGitHubGitUser = (
  user: NonNullable<RestEndpointMethodTypes["pulls"]["listCommits"]["response"]["data"][number]["author"]>,
) => ({
  name: user.name ?? null,
  login: user.login,
  email: user.email ?? null,
});

/**
 * Converts an Octokit Pull Request List item response to our internal PullRequest type.
 */
export const convertGitHubPullRequestListItem = (pr: RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][number]): PullRequest => {
  const repoId = {
    owner: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
  };

  return {
    id: pr.id,
    number: pr.number,
    head: {
      ...repoId,
      ref: pr.head.ref,
      sha: pr.head.sha,
    },
    base: {
      ...repoId,
      ref: pr.base.ref,
      sha: pr.base.sha,
    },
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
    user: pr.user ? convertGitHubUser(pr.user) : null,
  };
};

/**
 * Converts an Octokit Pull Request response to our internal PullRequest type.
 */
export const convertGitHubPullRequest = (pr: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"]): PullRequest => {
  const repoId = {
    owner: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
  };

  return {
    id: pr.id,
    number: pr.number,
    head: {
      ...repoId,
      ref: pr.head.ref,
      sha: pr.head.sha,
    },
    base: {
      ...repoId,
      ref: pr.base.ref,
      sha: pr.base.sha,
    },
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
    user: convertGitHubUser(pr.user),
  };
};

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
  user: comment.user ? convertGitHubUser(comment.user) : null,
});

/**
 * Converts an Octokit Commit Comment response to our internal CommitComment type.
 */
export const convertGitHubCommitComment = (
  comment: RestEndpointMethodTypes["repos"]["listCommentsForCommit"]["response"]["data"][number],
): CommitComment => ({
  id: comment.id,
  body: comment.body,
  createdAt: new Date(comment.created_at),
  updatedAt: new Date(comment.updated_at),
  path: comment.path ?? null,
  position: comment.position ?? null,
  line: comment.line ?? null,
  user: comment.user ? convertGitHubUser(comment.user) : null,
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
  user: convertGitHubUser(comment.user),
});

/**
 * Converts an Octokit Pull Request File response to our internal PullRequestFile type.
 */
export const convertGitHubFile = (file: RestEndpointMethodTypes["pulls"]["listFiles"]["response"]["data"][number]): CommitFile => ({
  filename: file.filename,
  previousFilename: file.previous_filename ?? null,
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
export const convertGitHubCommit = (commit: RestEndpointMethodTypes["pulls"]["listCommits"]["response"]["data"][number]): Commit => ({
  sha: commit.sha,
  commit: {
    author: commit.author ? convertGitHubGitUser(commit.author) : null,
    committer: commit.committer ? convertGitHubGitUser(commit.committer) : null,
    message: commit.commit.message,
    commentCount: commit.commit.comment_count,
    tree: {
      sha: commit.commit.tree.sha,
      url: commit.commit.tree.url,
    },
  },
  parents: commit.parents.map((parent) => ({
    sha: parent.sha,
    url: parent.url,
  })),
  ...(commit.stats
    ? {
        stats: {
          total: commit.stats.total ?? null,
          additions: commit.stats.additions ?? null,
          deletions: commit.stats.deletions ?? null,
        },
      }
    : {}),
  url: commit.html_url,
});
