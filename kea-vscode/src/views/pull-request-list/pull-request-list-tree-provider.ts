import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { PullRequestListNode } from "./pull-request-list-node";
import { RepoTreeNode } from "./repo-tree-node";
import { TreeNodeProvider } from "./tree-node-provider";

type PullRequestListTreeNode = RepoTreeNode | PullRequestListNode;

/**
 * Provides a list of pull requests for all the repositories in the workspace.
 */
export class PullRequestListTreeProvider extends TreeNodeProvider<PullRequestListTreeNode> {
  #ctx: IKeaContext;

  constructor(ctx: IKeaContext) {
    super();
    this.#ctx = ctx;
  }

  override _getRootChildren = async (): Promise<PullRequestListTreeNode[]> => {
    const allRepoInfo = await this.#ctx.gitManager.getAllRepositoriesAndInfo();

    const rootItems: PullRequestListTreeNode[] = [];
    for (const repoInfo of allRepoInfo) {
      if (repoInfo instanceof Error) {
        Logger.error(`Error creating RepoTreeNode: ${repoInfo.message}`);
        continue;
      }

      const { repository, workspaceFolder: workspace } = repoInfo;
      const rootItem = new RepoTreeNode(repository, workspace);
      rootItems.push(rootItem);
    }
    return rootItems;
  };

  override _invalidateCache = (): void => {
    this.#ctx.cache.clear();
  };
}
