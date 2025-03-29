import { AuthenticationSession } from "vscode";
import { Cache } from "../core/cache";
import { IKeaRepository } from "../repository/kea-repository";

export interface IAccount {
  session: AuthenticationSession;
  isRepoForAccount: (repoUrl: string) => boolean;
  tryCreateRepoForAccount: (repoUrl: string, cache: Cache) => IKeaRepository | Error;
}
