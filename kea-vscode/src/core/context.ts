import { AccountManager, IAccountManager } from "../account/account-manager";
import { ILruApiCache, LruApiCache } from "../cache/lru-api/lru-api-cache";
import { ITreeDecorationManager, TreeDecorationManager } from "../decorations/tree-decoration-manager";
import { GitManager, IGitManager } from "../git/git-manager";
import { IRepositoryManager, RepositoryManager } from "../repository/repository-manager";
import { PullRequestListTreeProvider } from "../views/pull-request-list/pull-request-list-tree-provider";
import { PullRequestContentsProvider } from "../views/pull-request-contents/pull-request-contents-provider";
import { ITreeViewContainer, TreeViewContainer } from "../views/tree-view-container";

export interface IKeaContext {
  accountManager: IAccountManager;
  gitManager: IGitManager;
  repositoryManager: IRepositoryManager;
  treeDecorationManager: ITreeDecorationManager;
  cache: ILruApiCache;
  pullRequestListTree: ITreeViewContainer<PullRequestListTreeProvider>;
  pullRequestContents: ITreeViewContainer<PullRequestContentsProvider>;
}

const MAX_CACHE_SIZE = 1000;

export class KeaContext implements IKeaContext {
  accountManager: IAccountManager;
  gitManager: IGitManager;
  repositoryManager: IRepositoryManager;
  treeDecorationManager: TreeDecorationManager;
  cache: ILruApiCache;
  pullRequestListTree: ITreeViewContainer<PullRequestListTreeProvider>;
  pullRequestContents: ITreeViewContainer<PullRequestContentsProvider>;

  constructor() {
    this.cache = new LruApiCache(MAX_CACHE_SIZE);

    this.accountManager = new AccountManager();
    this.gitManager = new GitManager(this);
    this.repositoryManager = new RepositoryManager();

    this.treeDecorationManager = new TreeDecorationManager();

    const prListProvider = new PullRequestListTreeProvider(this);
    this.pullRequestListTree = new TreeViewContainer("kea.pullRequestList", prListProvider);

    const prContentsProvider = new PullRequestContentsProvider(this);
    this.pullRequestContents = new TreeViewContainer("kea.pullRequestContents", prContentsProvider);
  }
}
