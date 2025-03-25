import { RepoId } from "../types/kea";
import { IKeaRepository } from "./kea-repository";

export interface IRepositoryManager {
  addRepository: (repo: IKeaRepository) => void;
  getRepositoryById: (authSessionAccountId: string, repoId: RepoId) => IKeaRepository | Error;
}

export class RepositoryManager implements IRepositoryManager {
  #repos = new Map<string, IKeaRepository>();

  addRepository = (repository: IKeaRepository): void => {
    this.#repos.set(repoIdToString(repository), repository);
  };

  getRepositoryById = (authSessionAccountId: string, repoId: RepoId): IKeaRepository | Error =>
    this.#repos.get(repoIdToString({ authSessionAccountId, repoId })) ?? new Error(`Repository not found: ${repoId.owner}/${repoId.repo}`);
}

interface RepoKey {
  authSessionAccountId: string;
  repoId: RepoId;
}

const repoIdToString = (repo: RepoKey): string => `${repo.authSessionAccountId}/${repo.repoId.owner}/${repo.repoId.repo}`;
