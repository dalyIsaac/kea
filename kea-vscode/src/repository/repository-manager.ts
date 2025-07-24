import * as vscode from "vscode";
import { IAccount, IAccountKey, isEqualAccountKey } from "../account/account";
import { GitHubAccount } from "../account/github/github-account";
import { IKeaContext } from "../core/context";
import { IKeaDisposable, KeaDisposable } from "../core/kea-disposable";
import { Logger } from "../core/logger";
import { LocalGitRepository } from "../git/local-git-repository";
import { isEqualRepoId, RepoId } from "../types/kea";
import { GitHubRepository } from "./github/github-repository";
import { IRemoteRepository } from "./remote-repository";
import { IRepository, Repository } from "./repository";

export interface IRepositoryManager extends IKeaDisposable {
  /**
   * Refreshes all the repositories in the manager.
   */
  refresh: () => Promise<void>;

  /**
   * Gets the repository for a given workspace folder.
   * If no repository is found, an error is returned.
   * @param workspaceFolder The workspace folder to get the repository for.
   * @returns The repository for the workspace folder, or an error if not found.
   */
  getRepository: (workspaceFolder: vscode.WorkspaceFolder) => IRepository | Error;

  /**
   * Gets the repository by its account key and repository ID.
   * @param accountKey The account key to identify the account.
   * @param repoId The ID of the repository to get.
   * @returns The repository with the given ID, or an error if not found.
   */
  getRepositoryById: (accountKey: IAccountKey, repoId: RepoId) => IRepository | Error;

  /**
   * Gets all repositories managed by the manager.
   * @returns An array of all repositories.
   */
  getAllRepositories: () => IRepository[];

  /**
   * Event that fires when the repository state changes.
   */
  onRepositoryStateChanged: vscode.Event<void>;
}

export class RepositoryManager extends KeaDisposable implements IRepositoryManager {
  #ctx: IKeaContext;
  #workspaceRepoMap = new Map<string, IRepository>();

  #onRepositoryStateChangedEmitter = new vscode.EventEmitter<void>();
  onRepositoryStateChanged = this.#onRepositoryStateChangedEmitter.event;

  constructor(ctx: IKeaContext) {
    super();
    this.#ctx = ctx;
  }

  refresh = async (workspaceFolders: vscode.WorkspaceFolder[] = []): Promise<void> => {
    // Remove repositories that are no longer in the workspace
    for (const workspace of this.#workspaceRepoMap.keys()) {
      if (!workspaceFolders.some((w) => w.uri.fsPath === workspace)) {
        this.#workspaceRepoMap.delete(workspace);
      }
    }

    const repos: Array<Promise<IRepository | Error>> = [];

    for (const workspace of workspaceFolders) {
      if (this.#workspaceRepoMap.has(workspace.uri.fsPath)) {
        continue;
      }

      repos.push(this.#createRepository(workspace));
    }

    const results = await Promise.all(repos);
    for (const result of results) {
      if (result instanceof Error) {
        Logger.error(result);
        continue;
      }

      this.#workspaceRepoMap.set(result.localRepository.workspaceFolder.uri.fsPath, result);
    }

    this.#onRepositoryStateChangedEmitter.fire();
  };

  #createRepository = async (workspaceFolder: vscode.WorkspaceFolder): Promise<IRepository | Error> => {
    const gitRepo = await this.#ctx.gitManager.getGitExtensionRepository(workspaceFolder);
    if (gitRepo instanceof Error) {
      return gitRepo;
    }

    const remote = gitRepo.state.remotes[0];
    if (remote === undefined) {
      return new Error("No remotes found");
    }

    const repoUrl = remote.fetchUrl ?? remote.pushUrl;
    if (repoUrl === undefined) {
      return new Error("No fetch or push URL found");
    }

    const allAccounts = await this.#ctx.accountManager.getAllAccounts();
    for (const account of allAccounts) {
      if (account instanceof Error) {
        continue;
      }

      const remoteRepository = this.#createRemoteRepository(repoUrl, account);
      if (remoteRepository instanceof Error) {
        continue;
      }

      const localRepository = new LocalGitRepository(workspaceFolder, gitRepo);
      return new Repository(remoteRepository.repoId, remoteRepository, localRepository);
    }

    return new Error("No valid repository found");
  };

  #createRemoteRepository = (repoUrl: string, account: IAccount): IRemoteRepository | Error => {
    const [owner, repoName] = repoUrl.replace(".git", "").split("/").slice(-2);
    if (owner === undefined || repoName === undefined) {
      return new Error("Expected to find owner and repo name in URL");
    }

    if (!account.isRepoForAccount(repoUrl)) {
      return new Error("Not a repository URL for the account");
    }

    if (account instanceof GitHubAccount) {
      return new GitHubRepository(repoUrl, { owner, repo: repoName }, account, this.#ctx.apiCache);
    }

    return new Error(`Unsupported account type: ${account.constructor.name}`);
  };

  getRepository = (workspaceFolder: vscode.WorkspaceFolder): IRepository | Error =>
    this.#workspaceRepoMap.get(workspaceFolder.uri.fsPath) ??
    new Error(`Repository not found for workspace: ${workspaceFolder.uri.fsPath}`);

  getRepositoryById = (accountKey: IAccountKey, repoId: RepoId): IRepository | Error => {
    for (const repo of this.#workspaceRepoMap.values()) {
      if (isEqualRepoId(repo.remoteRepository.repoId, repoId) && isEqualAccountKey(repo.remoteRepository.account.accountKey, accountKey)) {
        return repo;
      }
    }

    return new Error(`Repository not found for ID: ${JSON.stringify(repoId)}`);
  };

  getAllRepositories = (): IRepository[] => {
    return Array.from(this.#workspaceRepoMap.values());
  };
}
