import * as vscode from "vscode";
import { IAccountManager } from "../../account/account-manager";
import { Logger } from "../../core/logger";
import { PullRequestTreeItem } from "./pull-request-tree-item";
import { RepoTreeItem } from "./repo-tree-item";

type PullRequestListItem = RepoTreeItem | PullRequestTreeItem;

/**
 * Provides a list of pull requests for all the repositories in the workspace.
 */
export class PullRequestListTreeProvider implements vscode.TreeDataProvider<PullRequestListItem> {
  #accountManager: IAccountManager;

  #onDidChangeTreeData = new vscode.EventEmitter<void | PullRequestListItem | null | undefined>();
  readonly onDidChangeTreeData: vscode.Event<void | PullRequestListItem | null | undefined> = this.#onDidChangeTreeData.event;

  constructor(accountManager: IAccountManager) {
    this.#accountManager = accountManager;
  }

  getTreeItem = (element: PullRequestListItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (element?: PullRequestListItem): vscode.ProviderResult<PullRequestListItem[]> => {
    if (element === undefined) {
      Logger.info("Fetching root items for PullRequestListProvider");
      return this.#getRootChildren();
    }

    if (element instanceof RepoTreeItem) {
      Logger.info("Fetching pull requests for", element.repoId);
      return this.#getPullRequests(element);
    }

    return [];
  };

  #getRootChildren = async (): Promise<RepoTreeItem[]> => {
    const allItems = vscode.workspace.workspaceFolders?.map((workspace) => RepoTreeItem.create(this.#accountManager, workspace));
    if (allItems === undefined) {
      Logger.error("No workspace folders found");
      return [];
    }

    const resolvedItems = await Promise.all(allItems);

    const rootItems: RepoTreeItem[] = [];
    for (const item of resolvedItems) {
      if (item instanceof Error) {
        Logger.error(`Error creating PullRequestTreeItem: ${item.message}`);
        continue;
      }

      rootItems.push(item);
    }

    return rootItems;
  };

  #getPullRequests = async (repoTreeItem: RepoTreeItem): Promise<PullRequestTreeItem[]> => {
    const pullRequests = await repoTreeItem.account.getPullRequestList(repoTreeItem.repoId);

    if (pullRequests instanceof Error) {
      Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
      return [];
    }

    return pullRequests.map((pr) => new PullRequestTreeItem(repoTreeItem.account.session.id, pr));
  };

  refresh = (): void => {
    Logger.info("Refreshing PullRequestListProvider");
    this.#onDidChangeTreeData.fire();
  };
}
