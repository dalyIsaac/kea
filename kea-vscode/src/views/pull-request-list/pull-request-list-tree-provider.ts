import { IAccountManager } from "../../account/account-manager";
import { ILruApiCache } from "../../cache/lru-api/lru-api-cache";
import { getAllRepositories } from "../../core/git";
import { Logger } from "../../core/logger";
import { IRepositoryManager } from "../../repository/repository-manager";
import { PullRequestListNode } from "./pull-request-list-node";
import { RepoTreeNode } from "./repo-tree-node";
import { TreeNodeProvider } from "./tree-node-provider";

type PullRequestListTreeNode = RepoTreeNode | PullRequestListNode;

/**
 * Provides a list of pull requests for all the repositories in the workspace.
 */
export class PullRequestListTreeProvider extends TreeNodeProvider<PullRequestListTreeNode> {
  #accountManager: IAccountManager;
  #repositoryManager: IRepositoryManager;
  #cache: ILruApiCache;

  constructor(accountManager: IAccountManager, repositoryManager: IRepositoryManager, cache: ILruApiCache) {
    super();
    this.#accountManager = accountManager;
    this.#repositoryManager = repositoryManager;
    this.#cache = cache;
  }

  override _getRootChildren = async (): Promise<PullRequestListTreeNode[]> => {
    const allRepoInfo = await getAllRepositories(this.#accountManager, this.#repositoryManager, this.#cache);

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
    this.#cache.clear();
  };
}
