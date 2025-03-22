import * as vscode from "vscode";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestFile, PullRequestId, RepoId } from "../types/kea";

export interface IRepository {
  /**
   * The AuthenticationSessionAccountInformation id.
   */
  accountId: string;

  repoId: RepoId;

  getPullRequestList: (repoId: RepoId) => Promise<PullRequest[] | Error>;
  getIssueComments: (issueId: IssueId) => Promise<IssueComment[] | Error>;
  getPullRequestReviewComments: (pullId: PullRequestId) => Promise<PullRequestComment[] | Error>;
  getPullRequestFiles: (pullId: PullRequestId) => Promise<PullRequestFile[] | Error>;

  onDidChangeIssueComments: vscode.Event<IssueComment[] | Error>;
  onDidChangePullRequestReviewComments: vscode.Event<PullRequestComment[] | Error>;
}
