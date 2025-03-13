import { AuthenticationSession } from "vscode";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestId, RepoId } from "../types/kea";

export interface IAccount {
  session: AuthenticationSession;
  getPullRequestList: (repoId: RepoId) => Promise<PullRequest[] | Error>;
  getIssueComments: (issueId: IssueId) => Promise<IssueComment[] | Error>;
  getPullRequestReviewComments: (pullId: PullRequestId) => Promise<PullRequestComment[] | Error>;
}
