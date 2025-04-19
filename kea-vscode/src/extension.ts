import * as vscode from "vscode";

import { IAccountKey } from "./account/account";
import { AccountManager } from "./account/account-manager";
import { Logger } from "./core/logger";
import { CommentsRootDecorationProvider } from "./decorations/comments-root-decoration-provider";
import { FileCommentDecorationProvider } from "./decorations/file-comment-decoration-provider";
import { TreeDecorationManager } from "./decorations/tree-decoration-manager";
import { LruApiCache } from "./lru-cache/lru-api-cache";
import { RepositoryManager } from "./repository/repository-manager";
import { PullRequestId } from "./types/kea";
import { PullRequestContentsProvider } from "./views/pull-request-contents/pull-request-contents-provider";
import { PullRequestListTreeProvider } from "./views/pull-request-list/pull-request-list-tree-provider";

const MAX_CACHE_SIZE = 1000; // Maximum number of items in the cache.

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

  // Commands.
  vscode.commands.registerCommand("kea.refreshPullRequestList", () => {
    pullRequestListTreeProvider.refresh();
  });
  vscode.commands.registerCommand("kea.openPullRequest", async ([accountKey, pullId]: [IAccountKey, PullRequestId]) => {
    await pullRequestContentsProvider.openPullRequest(accountKey, pullId);

    const repository = repositoryManager.getRepositoryById(accountKey, pullId);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
      return;
    }

    treeDecorationManager.updateListeners(repository);
  });

  vscode.commands.registerCommand("kea.refreshPullRequest", () => {
    pullRequestContentsProvider.refresh();
  });
}

export function deactivate() {
  Logger.info("Kea extension deactivated");
}
