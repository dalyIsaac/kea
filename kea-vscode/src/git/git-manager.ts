import * as vscode from "vscode";
import { IAccount } from "../account/account";
import { IKeaContext } from "../core/context";
import { IKeaDisposable, KeaDisposable } from "../core/kea-disposable";
import { Logger } from "../core/logger";
import { WrappedError } from "../core/wrapped-error";
import { IKeaRepository } from "../repository/kea-repository";
import { Branch, GitApi, GitExtension, Repository } from "../types/git";
import { ILocalGitRepository, LocalGitRepository } from "./local-git-repository";

export interface RepoInfo {
  repository: IKeaRepository;
  workspaceFolder: vscode.WorkspaceFolder;
  account: IAccount;
}

export interface IGitManager extends IKeaDisposable {
  getAllRepositoriesAndInfo: () => Promise<Array<RepoInfo | Error>>;
  getRepositoryInfo: (workspace: vscode.WorkspaceFolder) => Promise<RepoInfo | Error>;
  getGitRepository: (workspaceFolder: vscode.WorkspaceFolder) => Promise<Repository | Error>;
  getGitBranchForRepository: (workspaceFolder: vscode.WorkspaceFolder) => Promise<Branch | Error>;
  getLocalGitRepository: (workspaceFolder: vscode.WorkspaceFolder) => Promise<ILocalGitRepository | Error>;

  onRepositoryStateChanged: vscode.Event<Repository>;
}

export class GitManager extends KeaDisposable implements IGitManager {
  #ctx: IKeaContext;
  #gitApi: GitApi | undefined = undefined;

  #openRepos = new Map<vscode.Uri, Repository>();
  #localGitRepos = new Map<vscode.Uri, ILocalGitRepository>();

  #onRepositoryStateChanged = new vscode.EventEmitter<Repository>();
  onRepositoryStateChanged = this.#onRepositoryStateChanged.event;

  constructor(ctx: IKeaContext) {
    super();
    this.#ctx = ctx;
  }

  #getGitApi = async (): Promise<GitApi | Error> => {
    if (this.#gitApi) {
      return this.#gitApi;
    }

    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");
    if (gitExtension === undefined) {
      return new Error("Git extension not found");
    }

    if (!gitExtension.isActive) {
      try {
        await gitExtension.activate();
      } catch (error) {
        return new WrappedError("Failed to activate Git extension", error);
      }
    }

    this.#gitApi = gitExtension.exports.getAPI(1);
    return this.#gitApi;
  };

  getAllRepositoriesAndInfo = async (): Promise<Array<RepoInfo | Error>> =>
    Promise.all(
      vscode.workspace.workspaceFolders?.map(async (workspace) => {
        const repo = await this.getGitRepository(workspace);
        if (repo instanceof Error) {
          return repo;
        }

        return this.getRepositoryInfo(workspace);
      }) ?? [],
    );

  getRepositoryInfo = async (workspace: vscode.WorkspaceFolder): Promise<RepoInfo | Error> => {
    const repo = await this.getGitRepository(workspace);
    if (repo instanceof Error) {
      return repo;
    }

    const remote = repo.state.remotes[0];
    if (remote === undefined) {
      return new Error("No remotes found");
    }

    const repoUrl = remote.fetchUrl ?? remote.pushUrl;
    if (repoUrl === undefined) {
      return new Error("No fetch or push URL found");
    }

    for (const account of await this.#ctx.accountManager.getAllAccounts()) {
      if (account instanceof Error) {
        Logger.error(account);
        continue;
      }

      const repo = account.tryCreateRepoForAccount(repoUrl, this.#ctx.apiCache);
      if (repo instanceof Error) {
        Logger.error(`Error creating repository for account`, repo);
        continue;
      }

      this.#ctx.repositoryManager.addRepository(repo);
      return { repository: repo, workspaceFolder: workspace, account };
    }

    return new Error("No account found for repository");
  };

  getGitRepository = async (workspaceFolder: vscode.WorkspaceFolder): Promise<Repository | Error> => {
    const cachedRepo = this.#openRepos.get(workspaceFolder.uri);
    if (cachedRepo) {
      return cachedRepo;
    }

    const api = await this.#getGitApi();
    if (api instanceof Error) {
      return api;
    }

    // Open the repository if it is not already opened. This can occur if the Kea extension is
    // activated before the Git extension.
    const repo = api.getRepository(workspaceFolder.uri) ?? (await api.openRepository(workspaceFolder.uri));
    if (repo === null) {
      return new Error(`No repository found for ${workspaceFolder.uri.toString()}`);
    }

    this.#openRepos.set(workspaceFolder.uri, repo);
    this._registerDisposable(
      repo.state.onDidChange(() => {
        this.#onRepositoryStateChange(repo);
      }),
    );

    return repo;
  };

  getGitBranchForRepository = async (workspaceFolder: vscode.WorkspaceFolder): Promise<Branch | Error> => {
    const repo = await this.getGitRepository(workspaceFolder);
    if (repo instanceof Error) {
      return repo;
    }

    const branch = repo.state.HEAD;
    if (branch === undefined) {
      return new Error("No branch found");
    }

    return branch;
  };

  #onRepositoryStateChange = (repo: Repository): void => {
    this.#onRepositoryStateChanged.fire(repo);
  };

  getLocalGitRepository = async (workspaceFolder: vscode.WorkspaceFolder): Promise<ILocalGitRepository | Error> => {
    const cachedLocalRepo = this.#localGitRepos.get(workspaceFolder.uri);
    if (cachedLocalRepo) {
      return cachedLocalRepo;
    }

    const localRepo = new LocalGitRepository(workspaceFolder.uri.fsPath, this.#ctx.apiCache);
    const isValid = await localRepo.validateRepository();
    if (isValid instanceof Error) {
      return new WrappedError(`Invalid Git repository at ${workspaceFolder.uri.fsPath}`, isValid);
    }

    if (!isValid) {
      return new Error(`No valid Git repository found at ${workspaceFolder.uri.fsPath}`);
    }

    this.#localGitRepos.set(workspaceFolder.uri, localRepo);
    this._registerDisposable(localRepo);
    return localRepo;
  };
}
