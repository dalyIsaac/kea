import { AuthenticationSession } from "vscode";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestFile, PullRequestId, RepoId } from "../types/kea";

export interface IAccount {
  session: AuthenticationSession;
  isRepoForAccount: (repoUrl: string) => boolean;
  getPullRequestList: (repoId: RepoId) => Promise<PullRequest[] | Error>;
  getIssueComments: (issueId: IssueId) => Promise<IssueComment[] | Error>;
  getPullRequestReviewComments: (pullId: PullRequestId) => Promise<PullRequestComment[] | Error>;
  getPullRequestFiles: (pullId: PullRequestId) => Promise<PullRequestFile[] | Error>;
}
