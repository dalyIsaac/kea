import { IAccountKey } from "../../account/account";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { IRepositoryManager } from "../../repository/repository-manager";
import { PullRequest, PullRequestId } from "../../types/kea";
import { TreeNodeProvider } from "../pull-request-list/tree-node-provider";
import { CommentsRootTreeNode } from "./comments-root-tree-node";

type PullRequestTreeNode = CommentsRootTreeNode | FilesRootTreeNode | CommitsRootTreeNode;

/**
 * Provides information about the current pull request.
 */
export class PullRequestTreeProvider extends TreeNodeProvider<PullRequestTreeNode> {
  #repositoryManager: IRepositoryManager;
  #pullInfo: { repository: IKeaRepository; pullId: PullRequestId; pullRequest: PullRequest } | undefined;
  #commentsRootTreeNode?: CommentsRootTreeNode;
  #filesRootTreeNode?: FilesRootTreeNode;
  #commitsRootTreeNode?: CommitsRootTreeNode;

  constructor(repositoryManager: IRepositoryManager) {
    this.#repositoryManager = repositoryManager;
  }

  override _getRootChildren = async (): Promise<PullRequestTreeNode[]> => {
    if (this.#pullInfo === undefined) {
      Logger.error("Pull request is not open");
      return [];
    }

    const { repository, pullId } = this.#pullInfo;

    this.#commentsRootTreeNode ??= new CommentsRootTreeNode(repository, pullId);
    this.#filesRootTreeNode ??= new FilesRootTreeNode(repository, pullId);
    this.#commitsRootTreeNode ??= new CommitsRootTreeNode(repository, pullId);

    return [this.#commentsRootTreeNode, this.#filesRootTreeNode, this.#commitsRootTreeNode];
  };

  refresh = (): void => {
    Logger.info("Refreshing PullRequestProvider");
    this.#onDidChangeTreeData.fire();
  };

  openPullRequest = async (accountKey: IAccountKey, pullId: PullRequestId): Promise<boolean> => {
    Logger.info("Opening pull request", pullId);

    const repository = this.#repositoryManager.getRepositoryById(accountKey, pullId);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
      this.#pullInfo = undefined;
      return false;
    }

    const pullRequest = await repository.getPullRequest(pullId, this.#forceRefresh);
    if (pullRequest instanceof Error) {
      Logger.error("Error getting pull request", pullRequest);
      this.#pullInfo = undefined;
      return false;
    }

    this.#pullInfo = { repository, pullId, pullRequest };
    this._onDidChangeTreeData.fire();
    return true;
  };
}
