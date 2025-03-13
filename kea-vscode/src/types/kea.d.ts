export interface RepoId {
  owner: string;
  repo: string;
}

export interface PullRequestId extends RepoId {
  number: number;
}

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

export interface PullRequestComment {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  replyTo: number | null;
  startLine: number;
  originalStartLine: number;
  startSide: Side;
  line: number;
  originalLine: number;
  side: Side;
  user: {
    login: string;
    avatarUrl: string;
  };
}
