import { IApiCache } from "../cache/api/api-cache";
import { IKeaRepository } from "../repository/kea-repository";

export interface IAccountKey {
  providerId: string;
  accountId: string;
}

export interface IAccount {
  accountKey: IAccountKey;
  isRepoForAccount: (repoUrl: string) => boolean;
  tryCreateRepoForAccount: (repoUrl: string, cache: IApiCache) => IKeaRepository | Error;
}
