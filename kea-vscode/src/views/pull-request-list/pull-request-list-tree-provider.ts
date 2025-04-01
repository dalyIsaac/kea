import * as vscode from "vscode";
import { IAccountManager } from "../../account/account-manager";
import { ICache } from "../../core/cache";
import { Logger } from "../../core/logger";
import { IRepositoryManager } from "../../repository/repository-manager";
import { PullRequestTreeNode } from "./pull-request-tree-node";
import { RepoTreeNode } from "./repo-tree-node";
import { TreeNodeProvider } from "./tree-node-provider";

type PullRequestListNode = RepoTreeNode | PullRequestTreeNode;

/**
 * Provides a list of pull requests for all the repositories in the workspace.
 */
export class PullRequestListTreeProvider extends TreeNodeProvider<PullRequestListNode> {
  #accountManager: IAccountManager;
  #repositoryManager: IRepositoryManager;
  #cache: ICache;

  constructor(accountManager: IAccountManager, repositoryManager: IRepositoryManager, cache: ICache) {
    super();
    this.#accountManager = accountManager;
    this.#repositoryManager = repositoryManager;
    this.#cache = cache;
  }

  override _getRootChildren = async (): Promise<PullRequestListNode[]> => {
    const allItems = vscode.workspace.workspaceFolders?.map((workspace) =>
      RepoTreeNode.create(this.#accountManager, this.#repositoryManager, workspace, this.#cache),
    );
    if (allItems === undefined) {
      Logger.error("No workspace folders found");
      return [];
    }

    const resolvedItems = await Promise.all(allItems);

    const rootItems: RepoTreeNode[] = [];
    for (const item of resolvedItems) {
      if (item instanceof Error) {
        Logger.error(`Error creating PullRequestTreeItem: ${item.message}`);
        continue;
      }

      rootItems.push(item);
    }

    return rootItems;
  };

  refresh = (): void => {
    Logger.info("Refreshing PullRequestListProvider");
    this._onDidChangeTreeData.fire();
  };
}
