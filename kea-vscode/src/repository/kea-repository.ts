import * as vscode from "vscode";
import { IAccount } from "../account/account";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestFile, PullRequestId, RepoId } from "../types/kea";

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
  getPullRequestFiles: (pullId: PullRequestId, forceRequest?: boolean) => Promise<PullRequestFile[] | Error>;

  onDidChangeIssueComments: vscode.Event<IssueCommentsPayload>;
  onDidChangePullRequestReviewComments: vscode.Event<PullRequestReviewCommentsPayload>;
}
