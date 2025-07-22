export interface RepoId {
  owner: string;
  repo: string;
}

export interface IssueId extends RepoId {
  number: number;
}

interface BaseComment {
  id: number;
  body: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User | null;
}

export interface IssueComment extends BaseComment {
  replyTo: number | null;
}

export interface CommitComment extends BaseComment {
  path: string | null;
  position: number | null;
  line: number | null;
}

export type FileComment = PullRequestComment | CommitComment;

export type Side = "LEFT" | "RIGHT" | "BOTH";

export interface PullRequestComment extends IssueComment {
  path: string;
  startLine: number | null;
  originalStartLine: number | null;
  startSide: Side | null;
  line: number | null;
  originalLine: number | null;
  side: Side | null;
}

export type PullRequestId = IssueId;

export interface PullRequestGitRef extends RepoId {
  ref: string;
  sha: string;
}

export interface PullRequest {
  id: number;
  number: number;
  head: PullRequestGitRef;
  base: PullRequestGitRef;
  title: string;
  state: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  mergedAt: Date | null;
  isDraft: boolean;
  repository: {
    name: string;
    owner: string;
    url: string;
  };
  user: User | null;
}

export const FileStatusDescriptions = {
  " ": "unmodified",
  M: " modified",
  T: "file type changed (regular file, symbolic link or submodule)",
  A: "added",
  D: "deleted",
  R: "renamed",
  C: `copied (if config option status.renames is set to "copies")`,
  U: "updated but unmerged",
} as const;

export type FileStatus = keyof typeof FileStatusDescriptions;

export interface CommitFile {
  filename: string;
  sha: string;
  status: FileStatus;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
  blobUrl: string;
  rawUrl: string;
  contentsUrl: string;
}

export interface User {
  name?: string | null;
  login: string | null;
  email?: string | null;
}

export interface Commit {
  sha: string;
  commit: {
    author: User | null;
    committer: User | null;
    message: string;
    commentCount: number;
    tree: {
      sha: string;
      url: string;
    };
  };
  stats?: {
    total?: number | null;
    additions?: number | null;
    deletions?: number | null;
  };
  url: string;
}
