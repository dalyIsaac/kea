import { AuthenticationSession } from "vscode";
import { PullRequest } from "../types/kea";

export interface IAccount {
  session: AuthenticationSession;
  getPullRequestList: (owner: string, repo: string) => Promise<PullRequest[] | Error>;
}
