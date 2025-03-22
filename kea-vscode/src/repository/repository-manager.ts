import { RepoId } from "../types/kea";
import { IKeaRepository } from "./kea-repository";

export interface IRepositoryManager {
  addRepo: (repo: IKeaRepository) => void;
  getRepoById: (authSessionAccountId: string, repoId: RepoId) => IKeaRepository | Error;
}

export class RepositoryManager implements IRepositoryManager {
  #repos = new Map<string, IKeaRepository>();

  addRepo = (repo: IKeaRepository): void => {
    this.#repos.set(repoIdToString(repo), repo);
  };

  getRepoById = (authSessionAccountId: string, repoId: RepoId): IKeaRepository | Error =>
    this.#repos.get(repoIdToString({ authSessionAccountId, repoId })) ?? new Error(`Repository not found: ${repoId.owner}/${repoId.repo}`);
}

interface RepoKey {
  authSessionAccountId: string;
  repoId: RepoId;
}

const repoIdToString = (repo: RepoKey): string => `${repo.authSessionAccountId}/${repo.repoId.owner}/${repo.repoId.repo}`;
