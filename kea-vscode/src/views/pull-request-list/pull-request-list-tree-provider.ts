import * as vscode from "vscode";
import { AppContext } from "../../core/app-context";
import { Logger } from "../../core/logger";
import { PullRequestTreeItem } from "./pull-request-tree-item";
import { RepoTreeItem } from "./repo-tree-item";

type PullRequestListItem = RepoTreeItem | PullRequestTreeItem;

/**
 * Provides a list of pull requests for all the repositories in the workspace.
 */
export class PullRequestListTreeProvider implements vscode.TreeDataProvider<PullRequestListItem> {
  #onDidChangeTreeData = new vscode.EventEmitter<void | PullRequestListItem | null | undefined>();

  readonly onDidChangeTreeData: vscode.Event<void | PullRequestListItem | null | undefined> = this.#onDidChangeTreeData.event;

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
    const allItems = vscode.workspace.workspaceFolders?.map((workspace) => RepoTreeItem.create(workspace));
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
    const accountName = "github";
    const account = await AppContext.getAccount(accountName);
    if (account instanceof Error) {
      Logger.error(`Error creating GitHub account: ${account.message}`);
      return [];
    }

    const pullRequests = await account.getPullRequestList(repoTreeItem.repoId);
    if (pullRequests instanceof Error) {
      Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
      return [];
    }

    return pullRequests.map((pr) => new PullRequestTreeItem(accountName, pr));
  };

  refresh = (): void => {
    Logger.info("Refreshing PullRequestListProvider");
    this.#onDidChangeTreeData.fire();
  };
}
