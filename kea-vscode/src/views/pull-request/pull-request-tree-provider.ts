import { IAccountKey } from "../../account/account";
import { Logger } from "../../core/logger";
import { LruApiCache } from "../../lru-cache/lru-api-cache";
import { IKeaRepository } from "../../repository/kea-repository";
import { IRepositoryManager } from "../../repository/repository-manager";
import { PullRequest, PullRequestId } from "../../types/kea";
import { TreeNodeProvider } from "../pull-request-list/tree-node-provider";
import { CommentsRootTreeNode } from "./comments-root-tree-node";
import { FilesRootTreeNode } from "./files-root-tree-node";

export type PullRequestTreeNode = CommentsRootTreeNode | FilesRootTreeNode;

/**
 * Provides information about the current pull request.
 */
export class PullRequestTreeProvider extends TreeNodeProvider<PullRequestTreeNode> {
  #repositoryManager: IRepositoryManager;
  #cache: LruApiCache;
  #pullInfo: { repository: IKeaRepository; pullId: PullRequestId; pullRequest: PullRequest } | undefined;
  #commentsRootTreeNode?: CommentsRootTreeNode;
  #filesRootTreeNode?: FilesRootTreeNode;

  constructor(repositoryManager: IRepositoryManager, cache: LruApiCache) {
    super();
    this.#repositoryManager = repositoryManager;
    this.#cache = cache;
  }

  override _getRootChildren = (): Promise<PullRequestTreeNode[]> => {
    if (this.#pullInfo === undefined) {
      Logger.error("Pull request is not open");
      return Promise.resolve([]);
    }

    const { repository, pullId } = this.#pullInfo;

    this.#commentsRootTreeNode ??= new CommentsRootTreeNode(repository, pullId, this);
    this.#filesRootTreeNode ??= new FilesRootTreeNode(repository, pullId);

    return Promise.resolve([this.#commentsRootTreeNode, this.#filesRootTreeNode]);
  };

  openPullRequest = async (accountKey: IAccountKey, pullId: PullRequestId): Promise<boolean> => {
    Logger.info("Opening pull request", pullId);

    const repository = this.#repositoryManager.getRepositoryById(accountKey, pullId);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
      this.#pullInfo = undefined;
      return false;
    }

    const pullRequest = await repository.getPullRequest(pullId);
    if (pullRequest instanceof Error) {
      Logger.error("Error getting pull request", pullRequest);
      this.#pullInfo = undefined;
      return false;
    }

    this.#pullInfo = { repository, pullId, pullRequest };
    this._onDidChangeTreeData.fire();
    return true;
  };

  override _invalidateCache = (): void => {
    if (this.#pullInfo === undefined) {
      Logger.error("Pull request is not open, cannot invalidate cache");
      return;
    }

    const { owner, repo } = this.#pullInfo.repository.repoId;
    this.#cache.invalidate(owner, repo);
  };
}
