import { AuthenticationSession } from "vscode";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestFile, PullRequestId, RepoId } from "../types/kea";

export interface IAccount {
  session: AuthenticationSession;
  isRepoForAccount: (repoUrl: string) => boolean;

  /**
   * @deprecated Use `IRepository` instead.
   */
  getPullRequestList: (repoId: RepoId) => Promise<PullRequest[] | Error>;

  /**
   * @deprecated Use `IRepository` instead.
   */
  getIssueComments: (issueId: IssueId) => Promise<IssueComment[] | Error>;

  /**
   * @deprecated Use `IRepository` instead.
   */
  getPullRequestReviewComments: (pullId: PullRequestId) => Promise<PullRequestComment[] | Error>;

  /**
   * @deprecated Use `IRepository` instead.
   */
  getPullRequestFiles: (pullId: PullRequestId) => Promise<PullRequestFile[] | Error>;
}
