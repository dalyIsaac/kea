import { AuthenticationSession } from "vscode";
import { ICache } from "../core/cache";
import { IKeaRepository } from "../repository/kea-repository";

export interface IAccount {
  session: AuthenticationSession;
  isRepoForAccount: (repoUrl: string) => boolean;
  tryCreateRepoForAccount: (repoUrl: string, cache: ICache) => IKeaRepository | Error;
}
