import { IAccountKey } from "../../account/account";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { isSamePullRequest } from "../../type-utils";
import { PullRequest, PullRequestId } from "../../types/kea";
import { TreeNodeProvider } from "../tree-node-provider";
import { CommentsRootTreeNode } from "./comments/comments-root-tree-node";
import { CommitsRootTreeNode } from "./commits/commits-root-tree-node";
import { FilesRootTreeNode } from "./files/files-root-tree-node";

export type PullRequestTreeNode = CommitsRootTreeNode | CommentsRootTreeNode | FilesRootTreeNode;

/**
 * Provides information about the current pull request.
 */
export class PullRequestContentsProvider extends TreeNodeProvider<PullRequestTreeNode> {
  #ctx: IKeaContext;
  #pullInfo: { repository: IKeaRepository; pullId: PullRequestId; pullRequest: PullRequest } | undefined;
  #commentsRootTreeNode?: CommentsRootTreeNode;
  #filesRootTreeNode?: FilesRootTreeNode;
  #commitsRootTreeNode?: CommitsRootTreeNode;

  constructor(ctx: IKeaContext) {
    super();
    this.#ctx = ctx;
  }

  override _getRootChildren = async (): Promise<PullRequestTreeNode[]> => {
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
      await this.#commentsRootTreeNode?.dispose();

      this.#commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, this);
      this.#filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
      this.#commitsRootTreeNode = new CommitsRootTreeNode(repository, pullId);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Promise.resolve([this.#commitsRootTreeNode!, this.#commentsRootTreeNode!, this.#filesRootTreeNode!]);
  };

  openPullRequest = async (accountKey: IAccountKey, pullId: PullRequestId): Promise<boolean> => {
    const repository = this.#ctx.repositoryManager.getRepositoryById(accountKey, pullId);
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

    this.#ctx.pullRequestContents.treeView.description = `#${pullRequest.number} ${pullRequest.title}`;

    return true;
  };

  override _invalidateCache = (): void => {
    if (this.#pullInfo === undefined) {
      Logger.error("Pull request is not open, cannot invalidate cache");
      return;
    }

    const { owner, repo } = this.#pullInfo.repository.repoId;
    this.#ctx.apiCache.invalidate(owner, repo);
  };
}
