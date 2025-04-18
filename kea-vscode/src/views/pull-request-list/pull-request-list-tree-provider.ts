import * as vscode from "vscode";
import { IAccountManager } from "../../account/account-manager";
import { Logger } from "../../core/logger";
import { ILruApiCache } from "../../lru-cache/lru-api-cache";
import { IRepositoryManager } from "../../repository/repository-manager";
import { PullRequestListNode } from "./pull-request-list-node";
import { RepoTreeNode } from "./repo-tree-node";
import { TreeNodeProvider } from "./tree-node-provider";

type PullRequestListTreeNode = RepoTreeNode | PullRequestListNode;

/**
 * Provides a list of pull requests for all the repositories in the workspace.
 */
export class PullRequestListTreeProvider extends TreeNodeProvider<PullRequestListTreeNode> {
  #accountManager: IAccountManager;
  #repositoryManager: IRepositoryManager;
  #cache: ILruApiCache;

  constructor(accountManager: IAccountManager, repositoryManager: IRepositoryManager, cache: ILruApiCache) {
    super();
    this.#accountManager = accountManager;
    this.#repositoryManager = repositoryManager;
    this.#cache = cache;
  }

  override _getRootChildren = async (): Promise<PullRequestListTreeNode[]> => {
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

  override _invalidateCache = (): void => {
    this.#cache.clear();
  };
}
