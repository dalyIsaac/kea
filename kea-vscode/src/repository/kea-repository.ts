import * as vscode from "vscode";
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
  /**
   * The AuthenticationSessionAccountInformation id.
   */
  authSessionAccountId: string;

  repoId: RepoId;
  remoteUrl: string;

  getPullRequestList: () => Promise<PullRequest[] | Error>;
  getIssueComments: (issueId: IssueId) => Promise<IssueComment[] | Error>;
  getPullRequestReviewComments: (pullId: PullRequestId) => Promise<PullRequestComment[] | Error>;
  getPullRequestFiles: (pullId: PullRequestId) => Promise<PullRequestFile[] | Error>;

  onDidChangeIssueComments: vscode.Event<IssueCommentsPayload>;
  onDidChangePullRequestReviewComments: vscode.Event<PullRequestReviewCommentsPayload>;
}
