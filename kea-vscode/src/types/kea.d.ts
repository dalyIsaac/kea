export interface RepoId {
  owner: string;
  repo: string;
}

export interface IssueId extends RepoId {
  number: number;
}

export interface IssueComment {
  id: number;
  body: string | null;
  createdAt: Date;
  updatedAt: Date;
  replyTo: number | null;
  user: {
    login: string;
    avatarUrl: string;
  };
}

export type PullRequestId = IssueId;

export interface PullRequest {
  id: number;
  number: number;
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
  user: {
    login: string;
    avatarUrl: string;
  };
}

export type Side = "LEFT" | "RIGHT" | "BOTH";

export interface PullRequestComment extends IssueComment {
  startLine: number;
  originalStartLine: number;
  startSide: Side;
  line: number;
  originalLine: number;
  side: Side;
}
