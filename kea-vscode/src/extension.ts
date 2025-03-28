import * as vscode from "vscode";

import { AccountManager } from "./account/account-manager";
import { Logger } from "./core/logger";
import { CommentsRootDecorationProvider } from "./decorations/comments-root-decoration-provider";
import { FileCommentDecorationProvider } from "./decorations/file-comment-decoration-provider";
import { TreeDecorationManager } from "./decorations/tree-decoration-manager";
import { RepositoryManager } from "./repository/repository-manager";
import { PullRequest, PullRequestId } from "./types/kea";
import { PullRequestListTreeProvider } from "./views/pull-request-list/pull-request-list-tree-provider";
import { PullRequestTreeProvider } from "./views/pull-request/pull-request-tree-provider";

export function activate(_context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  const accountManager = new AccountManager();
  const repositoryManager = new RepositoryManager();

  // Tree decorations.
  const treeDecorationManager = new TreeDecorationManager();
  treeDecorationManager.registerProviders(new FileCommentDecorationProvider(), new CommentsRootDecorationProvider(repositoryManager));

  // Tree providers.
  const pullRequestListTreeProvider = new PullRequestListTreeProvider(accountManager, repositoryManager);
  const pullRequestTreeProvider = new PullRequestTreeProvider(repositoryManager);

  // Register tree providers.
  vscode.window.registerTreeDataProvider("kea.pullRequestList", pullRequestListTreeProvider);
  vscode.window.registerTreeDataProvider("kea.pullRequest", pullRequestTreeProvider);

  vscode.authentication.onDidChangeSessions(accountManager.onDidChangeSessionsListener);

  // Commands.
  vscode.commands.registerCommand("kea.refreshPullRequestList", () => {
    pullRequestListTreeProvider.refresh();
  });
  vscode.commands.registerCommand(
    "kea.openPullRequest",
    ([authSessionAccountId, pullId, pullRequest]: [string, PullRequestId, PullRequest]) => {
      pullRequestTreeProvider.openPullRequest(authSessionAccountId, pullId, pullRequest);

      const repository = repositoryManager.getRepositoryById(authSessionAccountId, pullId);
      if (repository instanceof Error) {
        Logger.error("Error getting repository", repository);
        return;
      }

      treeDecorationManager.updateListeners(repository);
    },
  );

  vscode.commands.registerCommand("kea.refreshPullRequest", () => {
    pullRequestTreeProvider.refresh();
  });
}

export function deactivate() {
  Logger.info("Kea extension deactivated");
}
