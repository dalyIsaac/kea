import { ICache } from "../core/cache";
import { IKeaRepository } from "../repository/kea-repository";

export interface IAccountKey {
  providerId: string;
  accountId: string;
}

export interface IAccount extends IAccountKey {
  isRepoForAccount: (repoUrl: string) => boolean;
  tryCreateRepoForAccount: (repoUrl: string, cache: ICache) => IKeaRepository | Error;
}
