import { IAccountKey } from "../account/account";
import { RepoId } from "../types/kea";
import { IKeaRepository } from "./kea-repository";

export interface IRepositoryManager {
  addRepository: (repo: IKeaRepository) => void;
  getRepositoryById: (accountKey: IAccountKey, repoId: RepoId) => IKeaRepository | Error;
}

export class RepositoryManager implements IRepositoryManager {
  #repos = new Map<string, IKeaRepository>();

  addRepository = (repository: IKeaRepository): void => {
    this.#repos.set(repoIdToString(repository), repository);
  };

  getRepositoryById = (accountKey: IAccountKey, repoId: RepoId): IKeaRepository | Error =>
    this.#repos.get(repoIdToString({ account: accountKey, repoId })) ?? new Error(`Repository not found: ${repoId.owner}/${repoId.repo}`);
}

interface RepoKey {
  account: IAccountKey;
  repoId: RepoId;
}

const repoIdToString = (repo: RepoKey): string =>
  `${repo.account.providerId}/${repo.account.accountId}/${repo.repoId.owner}/${repo.repoId.repo}`;
