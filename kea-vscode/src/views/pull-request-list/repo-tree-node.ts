import * as vscode from "vscode";
import { IAccountManager } from "../../account/account-manager";
import { getRepo } from "../../core/git";
import { Logger } from "../../core/logger";
import { ILruApiCache } from "../../lru-cache/lru-api-cache";
import { IKeaRepository } from "../../repository/kea-repository";
import { IRepositoryManager } from "../../repository/repository-manager";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { PullRequestListNode } from "./pull-request-list-node";

export class RepoTreeNode implements IParentTreeNode<PullRequestListNode> {
  static #contextValue = "repository";
  collapsibleState: CollapsibleState;

  repository: IKeaRepository;
  workspace: vscode.WorkspaceFolder;

  private constructor(repository: IKeaRepository, workspace: vscode.WorkspaceFolder) {
    this.repository = repository;
    this.workspace = workspace;

    this.collapsibleState = "collapsed";
  }

  static create = async (
    accountManager: IAccountManager,
    repositoryManager: IRepositoryManager,
    workspace: vscode.WorkspaceFolder,
    cache: ILruApiCache,
  ): Promise<RepoTreeNode | Error> => {
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
      return new RepoTreeNode(repo, workspace);
    }

    return new Error("No account found for repository");
  };

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.workspace.name, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = RepoTreeNode.#contextValue;
    treeItem.description = this.repository.remoteUrl;
    return treeItem;
  };

  getChildren = async (): Promise<PullRequestListNode[]> => {
    const pullRequests = await this.repository.getPullRequestList();
    if (pullRequests instanceof Error) {
      Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
      return [];
    }

    return pullRequests.map((pr) => new PullRequestListNode(this.repository.account.accountKey, pr));
  };
}
