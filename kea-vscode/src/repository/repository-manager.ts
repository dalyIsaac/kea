import { IKeaRepository } from "./kea-repository";

export interface IRepositoryManager {
  addRepo: (repo: IKeaRepository) => void;
}

export class RepositoryManager implements IRepositoryManager {
  #repos = new Map<string, IKeaRepository>();

  addRepo = (repo: IKeaRepository): void => {
    this.#repos.set(repoIdToString(repo), repo);
  };
}

const repoIdToString = (repo: IKeaRepository): string => `${repo.authSessionAccountId}/${repo.repoId.owner}/${repo.repoId.repo}`;
