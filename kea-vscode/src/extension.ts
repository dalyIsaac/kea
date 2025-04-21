import * as vscode from "vscode";
import { AccountManager } from "./account/account-manager";
import { LruApiCache } from "./cache/lru-api/lru-api-cache";
import { CommandManager } from "./commands/command-manager";
import { Logger } from "./core/logger";
import { CommentsRootDecorationProvider } from "./decorations/comments-root-decoration-provider";
import { FileCommentDecorationProvider } from "./decorations/file-comment-decoration-provider";
import { TreeDecorationManager } from "./decorations/tree-decoration-manager";
import { RepositoryManager } from "./repository/repository-manager";
import { PullRequestContentsProvider } from "./views/pull-request-contents/pull-request-contents-provider";
import { PullRequestListTreeProvider } from "./views/pull-request-list/pull-request-list-tree-provider";

const MAX_CACHE_SIZE = 1000;

export function activate(_context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  const cache = new LruApiCache(MAX_CACHE_SIZE);

  const accountManager = new AccountManager();
  const repositoryManager = new RepositoryManager();

  // Tree decorations.
  const treeDecorationManager = new TreeDecorationManager();
  treeDecorationManager.registerProviders(new FileCommentDecorationProvider(), new CommentsRootDecorationProvider(repositoryManager));

  // Tree providers.
  const pullRequestListTreeProvider = new PullRequestListTreeProvider(accountManager, repositoryManager, cache);
  const pullRequestContentsProvider = new PullRequestContentsProvider(repositoryManager, cache);

  // Register tree providers.
  vscode.window.registerTreeDataProvider("kea.pullRequestList", pullRequestListTreeProvider);
  vscode.window.registerTreeDataProvider("kea.pullRequestContents", pullRequestContentsProvider);

  const _commandManager = new CommandManager({
    accountManager,
    repositoryManager,
    pullRequestContentsProvider,
    pullRequestListTreeProvider,
    cache,
    treeDecorationManager,
  });
}

export function deactivate() {
  Logger.info("Kea extension deactivated");
}
