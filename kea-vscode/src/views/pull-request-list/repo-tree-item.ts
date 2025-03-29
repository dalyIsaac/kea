import * as vscode from "vscode";
import { WorkspaceFolder } from "vscode";
import { IAccountManager } from "../../account/account-manager";
import { Cache } from "../../core/cache";
import { getRepo } from "../../core/git";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { IRepositoryManager } from "../../repository/repository-manager";

export class RepoTreeItem extends vscode.TreeItem {
  override contextValue = "repository";

  repository: IKeaRepository;
  workspace: WorkspaceFolder;

  private constructor(repository: IKeaRepository, workspace: WorkspaceFolder) {
    super(workspace.name, vscode.TreeItemCollapsibleState.Collapsed);

    this.repository = repository;
    this.workspace = workspace;

    this.description = repository.remoteUrl;
  }

  static create = async (
    accountManager: IAccountManager,
    repositoryManager: IRepositoryManager,
    workspace: WorkspaceFolder,
    cache: Cache,
  ): Promise<RepoTreeItem | Error> => {
    const repo = await getRepo(workspace.uri);
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

    for (const account of await accountManager.getAllAccounts()) {
      if (account instanceof Error) {
        Logger.error(`Error creating GitHub account: ${account.message}`);
        return account;
      }

      const repo = account.tryCreateRepoForAccount(repoUrl, cache);
      if (repo instanceof Error) {
        Logger.error(`Error creating repository for account`, repo);
        continue;
      }

      repositoryManager.addRepository(repo);
      return new RepoTreeItem(repo, workspace);
    }

    return new Error("No account found for repository");
  };
}
