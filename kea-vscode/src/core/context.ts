import * as vscode from "vscode";
import { AccountManager, IAccountManager } from "../account/account-manager";
import { ApiCache, IApiCache } from "../cache/api/api-cache";
import { FileCache, IFileCache } from "../cache/file/file-cache";
import { CommandManager } from "../commands/command-manager";
import { ICommandManager } from "../commands/command-manager-types";
import { ITreeDecorationManager, TreeDecorationManager } from "../decorations/tree-decoration-manager";
import { GitManager, IGitManager } from "../git/git-manager";
import { IRepositoryManager, RepositoryManager } from "../repository/repository-manager";
import { PullRequestContentsProvider } from "../views/pull-request-contents/pull-request-contents-provider";
import { PullRequestListTreeProvider } from "../views/pull-request-list/pull-request-list-tree-provider";
import { ITreeViewContainer, TreeViewContainer } from "../views/tree-view-container";
import { IKeaDisposable, KeaDisposable } from "./kea-disposable";

export interface IKeaContext extends IKeaDisposable {
  accountManager: IAccountManager;
  commandManager: ICommandManager;
  gitManager: IGitManager;
  repositoryManager: IRepositoryManager;
  treeDecorationManager: ITreeDecorationManager;
  apiCache: IApiCache;
  fileCache: IFileCache;
  pullRequestListTree: ITreeViewContainer<PullRequestListTreeProvider>;
  pullRequestContents: ITreeViewContainer<PullRequestContentsProvider>;
}

const MAX_API_CACHE_SIZE = 1000;
const MAX_FILE_CACHE_SIZE = 100;

export class KeaContext extends KeaDisposable implements IKeaContext {
  accountManager: IAccountManager;
  commandManager: ICommandManager;
  gitManager: IGitManager;
  repositoryManager: IRepositoryManager;
  treeDecorationManager: TreeDecorationManager;
  apiCache: IApiCache;
  fileCache: IFileCache;
  pullRequestListTree: ITreeViewContainer<PullRequestListTreeProvider>;
  pullRequestContents: ITreeViewContainer<PullRequestContentsProvider>;

  constructor(extCtx: vscode.ExtensionContext) {
    super();
    this.apiCache = new ApiCache(MAX_API_CACHE_SIZE);
    this.fileCache = this._registerDisposable(new FileCache(extCtx, MAX_FILE_CACHE_SIZE));

    this.accountManager = new AccountManager(this);
    this.gitManager = this._registerDisposable(new GitManager(this));
    this.repositoryManager = new RepositoryManager();

    this.treeDecorationManager = new TreeDecorationManager();

    const prListProvider = this._registerDisposable(new PullRequestListTreeProvider(this));
    this.pullRequestListTree = this._registerDisposable(new TreeViewContainer("kea.pullRequestList", prListProvider));

    const prContentsProvider = this._registerDisposable(new PullRequestContentsProvider(this));
    this.pullRequestContents = this._registerDisposable(new TreeViewContainer("kea.pullRequestContents", prContentsProvider));

    this.commandManager = this._registerDisposable(new CommandManager(this));
  }
}
