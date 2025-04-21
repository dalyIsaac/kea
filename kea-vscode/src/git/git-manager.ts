import * as vscode from "vscode";
import { IAccount } from "../account/account";
import { IKeaContext } from "../core/context";
import { IKeaDisposable, KeaDisposable } from "../core/kea-disposable";
import { Logger } from "../core/logger";
import { WrappedError } from "../core/wrapped-error";
import { IKeaRepository } from "../repository/kea-repository";
import { GitApi, GitExtension, Repository } from "../types/git";

export interface RepoInfo {
  repository: IKeaRepository;
  workspaceFolder: vscode.WorkspaceFolder;
  account: IAccount;
}

export interface IGitManager extends IKeaDisposable {
  getGitRepository: (workspaceFolder: vscode.WorkspaceFolder) => Promise<Repository | Error>;
  getAllRepositoriesAndInfo: () => Promise<Array<RepoInfo | Error>>;
  getRepositoryInfo: (workspace: vscode.WorkspaceFolder) => Promise<RepoInfo | Error>;
}

export class GitManager extends KeaDisposable implements IGitManager {
  #ctx: IKeaContext;
  #gitApi: GitApi | undefined = undefined;

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

  getGitRepository = async (workspaceFolder: vscode.WorkspaceFolder): Promise<Repository | Error> => {
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

    return repo;
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

      const repo = account.tryCreateRepoForAccount(repoUrl, this.#ctx.cache);
      if (repo instanceof Error) {
        Logger.error(`Error creating repository for account`, repo);
        continue;
      }

      this.#ctx.repositoryManager.addRepository(repo);
      return { repository: repo, workspaceFolder: workspace, account };
    }

    return new Error("No account found for repository");
  };
}
