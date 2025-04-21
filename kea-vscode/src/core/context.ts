import { AccountManager, IAccountManager } from "../account/account-manager";
import { ILruApiCache, LruApiCache } from "../cache/lru-api/lru-api-cache";
import { ITreeDecorationManager, TreeDecorationManager } from "../decorations/tree-decoration-manager";
import { GitManager, IGitManager } from "../git/git-manager";
import { IRepositoryManager, RepositoryManager } from "../repository/repository-manager";
import { PullRequestContentsProvider } from "../views/pull-request-contents/pull-request-contents-provider";
import { PullRequestListTreeProvider } from "../views/pull-request-list/pull-request-list-tree-provider";

export interface IKeaContext {
  accountManager: IAccountManager;
  gitManager: IGitManager;
  repositoryManager: IRepositoryManager;
  treeDecorationManager: ITreeDecorationManager;
  cache: ILruApiCache;
  pullRequestListTreeProvider: PullRequestListTreeProvider;
  pullRequestContentsProvider: PullRequestContentsProvider;
}

const MAX_CACHE_SIZE = 1000;

export class KeaContext implements IKeaContext {
  accountManager: IAccountManager;
  gitManager: IGitManager;
  repositoryManager: IRepositoryManager;
  treeDecorationManager: TreeDecorationManager;
  cache: ILruApiCache;
  pullRequestListTreeProvider: PullRequestListTreeProvider;
  pullRequestContentsProvider: PullRequestContentsProvider;

  constructor() {
    this.cache = new LruApiCache(MAX_CACHE_SIZE);

    this.accountManager = new AccountManager();
    this.gitManager = new GitManager(this);
    this.repositoryManager = new RepositoryManager();

    this.treeDecorationManager = new TreeDecorationManager();

    this.pullRequestListTreeProvider = new PullRequestListTreeProvider(this);
    this.pullRequestContentsProvider = new PullRequestContentsProvider(this);
  }
}
