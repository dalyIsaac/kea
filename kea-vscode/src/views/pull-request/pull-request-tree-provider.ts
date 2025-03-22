import * as vscode from "vscode";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { IRepositoryManager } from "../../repository/repository-manager";
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
  #repositoryManager: IRepositoryManager;

  #repository: IKeaRepository | undefined;
  #pullId: PullRequestId | undefined;
  #pullRequest: PullRequest | undefined;

  #onDidChangeTreeData = new vscode.EventEmitter<void | PullRequestTreeItem | null | undefined>();
  readonly onDidChangeTreeData: vscode.Event<void | PullRequestTreeItem | null | undefined> = this.#onDidChangeTreeData.event;

  constructor(repositoryManager: IRepositoryManager) {
    this.#repositoryManager = repositoryManager;
  }

  getTreeItem = (element: PullRequestTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (element?: PullRequestTreeItem): vscode.ProviderResult<PullRequestTreeItem[]> => {
    if (this.#pullId === undefined || this.#pullRequest === undefined) {
      Logger.error("Pull request is undefined");
      return [];
    }

    if (this.#repository === undefined) {
      Logger.error("Repository is undefined");
      return [];
    }

    if (element === undefined) {
      Logger.info("Fetching root items for PullRequestProvider");
      return PullRequestTreeProvider.#getRootChildren(this.#repository, this.#pullId);
    }

    if (element instanceof ParentTreeItem) {
      Logger.info("Fetching children for", element.label);
      return element.getChildren();
    }

    Logger.error("Unknown element type: ", element);
    return [];
  };

  static #getRootChildren = (repository: IKeaRepository, pullId: PullRequestId): PullRequestTreeItem[] => [
    new CommentsRootTreeItem(repository, pullId),
    new FilesRootTreeItem(repository, pullId),
    new CommitsRootTreeItem(),
  ];

  refresh = (): void => {
    Logger.info("Refreshing PullRequestProvider");
    this.#onDidChangeTreeData.fire();
  };

  openPullRequest = (authSessionAccountId: string, pullId: PullRequestId, pullRequest: PullRequest): void => {
    Logger.info("Opening pull request", pullId);

    const repository = this.#repositoryManager.getRepoById(authSessionAccountId, pullId);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
      return;
    }

    this.#repository = repository;
    this.#pullId = pullId;
    this.#pullRequest = pullRequest;
    this.refresh();
  };
}
