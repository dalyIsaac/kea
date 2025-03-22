import * as vscode from "vscode";

import { AccountManager } from "./account/account-manager";
import { Logger } from "./core/logger";
import { PullRequest, PullRequestId } from "./types/kea";
import { PullRequestListTreeProvider } from "./views/pull-request-list/pull-request-list-tree-provider";
import { PullRequestTreeProvider } from "./views/pull-request/pull-request-tree-provider";

export function activate(_context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  const accountManager = new AccountManager();

  // Tree providers.
  const pullRequestListTreeProvider = new PullRequestListTreeProvider(accountManager);
  const pullRequestTreeProvider = new PullRequestTreeProvider(accountManager);

  // Register tree providers.
  vscode.window.registerTreeDataProvider("kea.pullRequestList", pullRequestListTreeProvider);
  vscode.window.registerTreeDataProvider("kea.pullRequest", pullRequestTreeProvider);

  vscode.authentication.onDidChangeSessions(accountManager.onDidChangeSessionsListener);

  // Commands.
  vscode.commands.registerCommand("kea.refreshPullRequestList", () => {
    pullRequestListTreeProvider.refresh();
  });
  vscode.commands.registerCommand("kea.openPullRequest", async (args: [string, PullRequestId, PullRequest]) =>
    pullRequestTreeProvider.openPullRequest(...args),
  );

  vscode.commands.registerCommand("kea.refreshPullRequest", () => {
    pullRequestTreeProvider.refresh();
  });
}

export function deactivate() {
  Logger.info("Kea extension deactivated");
}
