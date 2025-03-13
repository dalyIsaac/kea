import { AuthenticationSession } from "vscode";
import { PullRequest, PullRequestComment, PullRequestId, RepoId } from "../types/kea";

export interface IAccount {
  session: AuthenticationSession;
  getPullRequestList: (repoId: RepoId) => Promise<PullRequest[] | Error>;
  getPullRequestComments: (pullId: PullRequestId) => Promise<PullRequestComment[] | Error>;
}
