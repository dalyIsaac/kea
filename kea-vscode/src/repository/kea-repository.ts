import * as vscode from "vscode";
import { IAccount } from "../account/account";
import { Commit, File, IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestId, RepoId } from "../types/kea";

export interface IssueCommentsPayload {
  issueId: IssueId;
  comments: IssueComment[] | Error;
}

export interface PullRequestReviewCommentsPayload {
  pullId: PullRequestId;
  comments: PullRequestComment[] | Error;
}

// TODO: make disposable
export interface IKeaRepository {
  account: IAccount;
  repoId: RepoId;
  remoteUrl: string;

  getPullRequestList: (forceRequest?: boolean) => Promise<PullRequest[] | Error>;
  getPullRequest: (pullId: PullRequestId, forceRequest?: boolean) => Promise<PullRequest | Error>;
  getIssueComments: (issueId: IssueId, forceRequest?: boolean) => Promise<IssueComment[] | Error>;
  getPullRequestReviewComments: (pullId: PullRequestId, forceRequest?: boolean) => Promise<PullRequestComment[] | Error>;
  getPullRequestFiles: (pullId: PullRequestId, forceRequest?: boolean) => Promise<File[] | Error>;
  getPullRequestCommits: (pullId: PullRequestId, forceRequest?: boolean) => Promise<Commit[] | Error>;

  onDidChangeIssueComments: vscode.Event<IssueCommentsPayload>;
  onDidChangePullRequestReviewComments: vscode.Event<PullRequestReviewCommentsPayload>;
}
