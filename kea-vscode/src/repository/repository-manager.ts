import { IAccountKey } from "../account/account";
import { RepoId } from "../types/kea";
import { IRepository } from "./repository";

export interface IRepositoryManager {
  addRepository: (repo: IRepository) => void;
  getRepositoryById: (accountKey: IAccountKey, repoId: RepoId) => IRepository | Error;
}

export class RepositoryManager implements IRepositoryManager {
  #repos = new Map<string, IRepository>();

  addRepository = (repository: IRepository): void => {
    this.#repos.set(
      repoIdToString({
        accountKey: repository.remoteRepository.account.accountKey,
        repoId: repository.remoteRepository.repoId,
      }),
      repository,
    );
  };

  getRepositoryById = (accountKey: IAccountKey, repoId: RepoId): IRepository | Error =>
    this.#repos.get(repoIdToString({ accountKey, repoId })) ?? new Error(`Repository not found: ${repoId.owner}/${repoId.repo}`);
}

interface RepoKey {
  accountKey: IAccountKey;
  repoId: RepoId;
}

const repoIdToString = (repo: RepoKey): string =>
  `${repo.accountKey.providerId}/${repo.accountKey.accountId}/${repo.repoId.owner}/${repo.repoId.repo}`;
