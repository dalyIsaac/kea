import * as vscode from "vscode";
import { IAccount } from "../../account/account";
import { IAccountManager } from "../../account/account-manager";
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
  #accountManager: IAccountManager;
  #account: IAccount | undefined;
  #pullId: PullRequestId | undefined;
  #pullRequest: PullRequest | undefined;

  #onDidChangeTreeData = new vscode.EventEmitter<void | PullRequestTreeItem | null | undefined>();
  readonly onDidChangeTreeData: vscode.Event<void | PullRequestTreeItem | null | undefined> = this.#onDidChangeTreeData.event;

  constructor(accountManager: IAccountManager) {
    this.#accountManager = accountManager;
  }

  getTreeItem = (element: PullRequestTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (element?: PullRequestTreeItem): vscode.ProviderResult<PullRequestTreeItem[]> => {
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
      Logger.info("Fetching children for", element.label);
      return element.getChildren();
    }

    Logger.error("Unknown element type: ", element);
    return [];
  };

  static #getRootChildren = (account: IAccount, pullId: PullRequestId): PullRequestTreeItem[] => [
    new CommentsRootTreeItem(account, pullId),
    new FilesRootTreeItem(account, pullId),
    new CommitsRootTreeItem(),
  ];

  refresh = (): void => {
    Logger.info("Refreshing PullRequestProvider");
    this.#onDidChangeTreeData.fire();
  };

  openPullRequest = async (sessionId: string, pullId: PullRequestId, pullRequest: PullRequest): Promise<void> => {
    Logger.info("Opening pull request", pullId);

    const account = await this.#accountManager.getAccountBySessionId(sessionId);
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
