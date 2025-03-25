import { AuthenticationSession } from "vscode";
import { IKeaRepository } from "../repository/kea-repository";

export interface IAccount {
  session: AuthenticationSession;
  isRepoForAccount: (repoUrl: string) => boolean;
  tryCreateRepoForAccount: (repoUrl: string) => IKeaRepository | Error;
}
