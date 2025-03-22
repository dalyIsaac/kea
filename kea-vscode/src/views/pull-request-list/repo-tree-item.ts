import * as vscode from "vscode";
import { WorkspaceFolder } from "vscode";
import { IAccount } from "../../account/account";
import { IAccountManager } from "../../account/account-manager";
import { getRepo } from "../../core/git";
import { Logger } from "../../core/logger";
import { Repository } from "../../types/git";
import { RepoId } from "../../types/kea";

export class RepoTreeItem extends vscode.TreeItem {
  override contextValue = "repository";

  account: IAccount;
  workspace: WorkspaceFolder;
  repo: Repository;
  remoteUrl: string;
  repoId: RepoId;

  private constructor(account: IAccount, workspace: WorkspaceFolder, repo: Repository, repoUrl: string, repoId: RepoId) {
    super(workspace.name, vscode.TreeItemCollapsibleState.Collapsed);

    this.account = account;
    this.workspace = workspace;
    this.repo = repo;
    this.remoteUrl = repoUrl;
    this.repoId = repoId;

    this.description = repoUrl;
  }

  static create = async (accountManager: IAccountManager, workspace: WorkspaceFolder): Promise<RepoTreeItem | Error> => {
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

    const [owner, repoName] = repoUrl.replace(".git", "").split("/").slice(-2);
    if (owner === undefined || repoName === undefined) {
      return new Error("Invalid repository URL");
    }

    for (const account of await accountManager.getAllAccounts()) {
      if (account instanceof Error) {
        Logger.error(`Error creating GitHub account: ${account.message}`);
        return account;
      }

      if (account.isRepoForAccount(repoUrl)) {
        return new RepoTreeItem(account, workspace, repo, repoUrl, { owner, repo: repoName });
      }
    }

    return new Error("No account found for repository");
  };
}
