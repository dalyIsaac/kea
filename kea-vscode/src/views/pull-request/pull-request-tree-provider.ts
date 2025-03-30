import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { IRepositoryManager } from "../../repository/repository-manager";
import { PullRequest, PullRequestId } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { CommentsRootTreeItem } from "./comments-root-tree-item";
import { CommitsRootTreeItem } from "./commits-root-tree-item";
import { FilesRootTreeItem } from "./files-root-tree-item";

export type PullRequestTreeItem = CommentsRootTreeItem | FilesRootTreeItem | CommitsRootTreeItem;

/**
 * Provides information about the current pull request.
 */
export class PullRequestTreeProvider implements vscode.TreeDataProvider<PullRequestTreeItem> {
  #repositoryManager: IRepositoryManager;

  #pullInfo: { repository: IKeaRepository; pullId: PullRequestId; pullRequest: PullRequest } | undefined;
  #onDidChangeTreeData = new vscode.EventEmitter<void | PullRequestTreeItem | null | undefined>();
  readonly onDidChangeTreeData: vscode.Event<void | PullRequestTreeItem | null | undefined> = this.#onDidChangeTreeData.event;

  constructor(repositoryManager: IRepositoryManager) {
    this.#repositoryManager = repositoryManager;
  }

  getTreeItem = (element: PullRequestTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (element?: PullRequestTreeItem): vscode.ProviderResult<PullRequestTreeItem[]> => {
    if (this.#pullInfo === undefined) {
      Logger.info("Pull request is not open");
      return [];
    }

    if (element === undefined) {
      Logger.info("Fetching root items for PullRequestProvider");
      return [
        new CommentsRootTreeItem(this.#pullInfo.repository, this.#pullInfo.pullId),
        new FilesRootTreeItem(this.#pullInfo.repository, this.#pullInfo.pullId),
        new CommitsRootTreeItem(),
      ];
    }

    if (element instanceof ParentTreeItem) {
      Logger.info("Fetching children for", element.label);
      return element.getChildren();
    }

    Logger.error("Unknown element type: ", element);
    return [];
  };

  refresh = (): void => {
    Logger.info("Refreshing PullRequestProvider");
    this.#onDidChangeTreeData.fire();
  };

  openPullRequest = (accountKey: IAccountKey, pullId: PullRequestId, pullRequest: PullRequest): boolean => {
    Logger.info("Opening pull request", pullId);

    const repository = this.#repositoryManager.getRepositoryById(accountKey, pullId);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
      this.#pullInfo = undefined;
      return false;
    }

    this.#pullInfo = { repository, pullId, pullRequest };
    this.refresh();
    return true;
  };
}
