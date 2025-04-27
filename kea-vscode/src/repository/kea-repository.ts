import * as vscode from "vscode";
import { IAccount } from "../account/account";
import { IKeaDisposable } from "../core/kea-disposable";
import {
  Commit,
  CommitComment,
  CommitFile,
  IssueComment,
  IssueId,
  PullRequest,
  PullRequestComment,
  PullRequestId,
  RepoId,
} from "../types/kea";

export interface IssueCommentsPayload {
  issueId: IssueId;
  comments: IssueComment[] | Error;
}

export interface PullRequestReviewCommentsPayload {
  pullId: PullRequestId;
  comments: PullRequestComment[] | Error;
}

export interface IKeaRepository extends IKeaDisposable {
  account: IAccount;
  repoId: RepoId;
  remoteUrl: string;

  getPullRequestList: (forceRequest?: boolean) => Promise<PullRequest[] | Error>;
  getPullRequest: (pullId: PullRequestId, forceRequest?: boolean) => Promise<PullRequest | Error>;
  getIssueComments: (issueId: IssueId, forceRequest?: boolean) => Promise<IssueComment[] | Error>;
  getPullRequestReviewComments: (pullId: PullRequestId, forceRequest?: boolean) => Promise<PullRequestComment[] | Error>;
  getPullRequestFiles: (pullId: PullRequestId, forceRequest?: boolean) => Promise<CommitFile[] | Error>;
  getPullRequestCommits: (pullId: PullRequestId, forceRequest?: boolean) => Promise<Commit[] | Error>;
  getCommitFiles: (commitSha: string, forceRequest?: boolean) => Promise<CommitFile[] | Error>;
  getCommitComments: (commitSha: string, forceRequest?: boolean) => Promise<CommitComment[] | Error>;
  getBlobUri: (sha1: string, forceRequest?: boolean) => Promise<vscode.Uri | Error>;

  onDidChangeIssueComments: vscode.Event<IssueCommentsPayload>;
  onDidChangePullRequestReviewComments: vscode.Event<PullRequestReviewCommentsPayload>;
}
