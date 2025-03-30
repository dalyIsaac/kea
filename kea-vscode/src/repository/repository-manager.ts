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
    this.#repos.set(
      repoIdToString({
        accountKey: repository.account.accountKey,
        repoId: repository.repoId,
      }),
      repository,
    );
  };

  getRepositoryById = (accountKey: IAccountKey, repoId: RepoId): IKeaRepository | Error =>
    this.#repos.get(repoIdToString({ accountKey, repoId })) ?? new Error(`Repository not found: ${repoId.owner}/${repoId.repo}`);
}

interface RepoKey {
  accountKey: IAccountKey;
  repoId: RepoId;
}

const repoIdToString = (repo: RepoKey): string =>
  `${repo.accountKey.providerId}/${repo.accountKey.accountId}/${repo.repoId.owner}/${repo.repoId.repo}`;
