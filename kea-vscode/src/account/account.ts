import { AuthenticationSession } from "vscode";
import { PullRequest } from "../types/pull-request";

export interface IAccount {
  session: AuthenticationSession;
  getPullRequestList: (owner: string, repo: string) => Promise<PullRequest[] | Error>;
}
