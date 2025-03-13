import * as vscode from "vscode";
import { Logger } from "../../core/logger";
import { CommentsRootTreeItem } from "./comments-root-tree-item";
import { CommitsRootTreeItem } from "./commits-root-tree-item";

type PullRequestTreeItem = CommitsRootTreeItem;

/**
 * Provides information about the current pull request.
 */
export class PullRequestTreeProvider implements vscode.TreeDataProvider<PullRequestTreeItem> {
  #onDidChangeTreeData = new vscode.EventEmitter<void | PullRequestTreeItem | null | undefined>();

  readonly onDidChangeTreeData: vscode.Event<void | PullRequestTreeItem | null | undefined> = this.#onDidChangeTreeData.event;

  getTreeItem = (element: PullRequestTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (element?: PullRequestTreeItem | undefined): vscode.ProviderResult<PullRequestTreeItem[]> => {
    if (element === undefined) {
      Logger.info("Fetching root items for PullRequestProvider");
      return this.#getRootChildren();
    }

    return [];
  };

  #getRootChildren = async (): Promise<PullRequestTreeItem[]> => {
    // TODO: Get the commits list, under a top-level tree item "Commits"
    // TODO: For each commit, get the changed files
    // TODO: Get all the comments for each file under each file
    // TODO: Get all the PR comments, under a top-level tree item "Comments"

    return [new CommentsRootTreeItem(), new CommitsRootTreeItem()];
  };

  refresh = (): void => {
    Logger.info("Refreshing PullRequestProvider");
    this.#onDidChangeTreeData.fire();
  };
}
