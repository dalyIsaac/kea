import { IAccountKey } from "../../account/account";
import { ILruApiCache } from "../../cache/lru-api/lru-api-cache";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { IRepositoryManager } from "../../repository/repository-manager";
import { isSamePullRequest } from "../../type-utils";
import { PullRequest, PullRequestId } from "../../types/kea";
import { TreeNodeProvider } from "../pull-request-list/tree-node-provider";
import { CommentsRootTreeNode } from "./comments/comments-root-tree-node";
import { CommitsRootTreeNode } from "./commits/commits-root-tree-node";
import { FilesRootTreeNode } from "./files/files-root-tree-node";

export type PullRequestTreeNode = CommitsRootTreeNode | CommentsRootTreeNode | FilesRootTreeNode;

/**
 * Provides information about the current pull request.
 */
export class PullRequestContentsProvider extends TreeNodeProvider<PullRequestTreeNode> {
  #repositoryManager: IRepositoryManager;
  #cache: ILruApiCache;
  #pullInfo: { repository: IKeaRepository; pullId: PullRequestId; pullRequest: PullRequest } | undefined;
  #commentsRootTreeNode?: CommentsRootTreeNode;
  #filesRootTreeNode?: FilesRootTreeNode;
  #commitsRootTreeNode?: CommitsRootTreeNode;

  constructor(repositoryManager: IRepositoryManager, cache: ILruApiCache) {
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

    if (
      !isSamePullRequest(this.#commentsRootTreeNode?.pullId, pullId) ||
      !isSamePullRequest(this.#filesRootTreeNode?.pullId, pullId) ||
      !isSamePullRequest(this.#commitsRootTreeNode?.pullId, pullId)
    ) {
      this.#commentsRootTreeNode?.dispose();

      this.#commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, this);
      this.#filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
      this.#commitsRootTreeNode = new CommitsRootTreeNode(repository, pullId);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Promise.resolve([this.#commitsRootTreeNode!, this.#commentsRootTreeNode!, this.#filesRootTreeNode!]);
  };

  openPullRequest = async (accountKey: IAccountKey, pullId: PullRequestId): Promise<boolean> => {
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
