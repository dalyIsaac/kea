import * as vscode from "vscode";
import { IAccount } from "../../account/account";
import { AppContext } from "../../core/app-context";
import { Logger } from "../../core/logger";
import { PullRequest, PullRequestId } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { CommentsRootTreeItem } from "./comments-root-tree-item";
import { CommitsRootTreeItem } from "./commits-root-tree-item";
import { FilesRootTreeItem } from "./files-root-tree-item";

type PullRequestTreeItem = CommitsRootTreeItem;

/**
 * Provides information about the current pull request.
 */
export class PullRequestTreeProvider implements vscode.TreeDataProvider<PullRequestTreeItem> {
  // Overrides.
  #onDidChangeTreeData = new vscode.EventEmitter<void | PullRequestTreeItem | null | undefined>();

  readonly onDidChangeTreeData: vscode.Event<void | PullRequestTreeItem | null | undefined> = this.#onDidChangeTreeData.event;

  // Properties.
  #account: IAccount | undefined;
  #pullId: PullRequestId | undefined;
  #pullRequest: PullRequest | undefined;

  // Overridden methods.
  getTreeItem = (element: PullRequestTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (element?: PullRequestTreeItem | undefined): vscode.ProviderResult<PullRequestTreeItem[]> => {
    if (this.#pullId === undefined || this.#pullRequest === undefined) {
      Logger.error("Pull request is undefined");
      // TODO
      return [];
    }

    if (this.#account === undefined) {
      Logger.error("Account is undefined");
      // TODO
      return [];
    }

    if (element === undefined) {
      Logger.info("Fetching root items for PullRequestProvider");
      return PullRequestTreeProvider.#getRootChildren(this.#account, this.#pullId);
    }

    if (element instanceof ParentTreeItem) {
      Logger.info(`Fetching children for ${element.label}`);
      return element.getChildren();
    }

    Logger.error(`Unknown element type: ${element}`);
    return [];
  };

  // Methods.
  static #getRootChildren = async (account: IAccount, pullId: PullRequestId): Promise<PullRequestTreeItem[]> => {
    // TODO: Get the commits list, under a top-level tree item "Commits"
    // TODO: For each commit, get the changed files
    // TODO: Get all the comments for each file under each file
    // TODO: Get all the PR comments, under a top-level tree item "Comments"

    return [new CommentsRootTreeItem(account, pullId), new FilesRootTreeItem(account, pullId), new CommitsRootTreeItem()];
  };

  refresh = (): void => {
    Logger.info("Refreshing PullRequestProvider");
    this.#onDidChangeTreeData.fire();
  };

  openPullRequest = async (accountName: string, pullId: PullRequestId, pullRequest: PullRequest): Promise<void> => {
    Logger.info(`Opening pull request ${pullId} for account ${accountName}`);

    const account = await AppContext.getAccount(accountName);
    if (account instanceof Error) {
      Logger.error(`Error getting account: ${account.message}`);
      return;
    }

    this.#account = account;
    this.#pullId = pullId;
    this.#pullRequest = pullRequest;
    this.refresh();
  };
}
