import { IKeaContext } from "../../core/context";
import { TreeNodeProvider } from "../tree-node-provider";
import { PullRequestListNode } from "./pull-request-list-node";
import { RepoTreeNode } from "./repo-tree-node";

type PullRequestListTreeNode = RepoTreeNode | PullRequestListNode;

/**
 * Provides a list of pull requests for all the repositories in the workspace.
 */
export class PullRequestListTreeProvider extends TreeNodeProvider<PullRequestListTreeNode> {
  #ctx: IKeaContext;

  constructor(ctx: IKeaContext) {
    super();
    this.#ctx = ctx;

    this._registerDisposable(this.#ctx.repositoryManager.onRepositoryStateChanged(this.#onRepositoryStateChanged));
  }

  #onRepositoryStateChanged = (): void => {
    this._onDidChangeTreeData.fire();
  };

  override _getRootChildren = (): Promise<PullRequestListTreeNode[]> => {
    const rootItems = this.#ctx.repositoryManager.getAllRepositories().map((repo) => new RepoTreeNode(this.#ctx, repo));

    return Promise.resolve(rootItems);
  };

  override _invalidateCache = (): void => {
    this.#ctx.apiCache.clear();
  };
}
