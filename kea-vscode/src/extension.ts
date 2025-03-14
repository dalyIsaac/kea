import * as vscode from "vscode";

import { AppContext } from "./core/app-context";
import { Logger } from "./core/logger";
import { PullRequest, PullRequestId } from "./types/kea";
import { PullRequestListTreeProvider } from "./views/pull-request-list/pull-request-list-tree-provider";
import { PullRequestTreeProvider } from "./views/pull-request/pull-request-tree-provider";

export function activate(_context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  // Tree providers.
  const pullRequestListTreeProvider = new PullRequestListTreeProvider();
  const pullRequestTreeProvider = new PullRequestTreeProvider();

  // Register tree providers.
  vscode.window.registerTreeDataProvider("kea.pullRequestList", pullRequestListTreeProvider);
  vscode.window.registerTreeDataProvider("kea.pullRequest", pullRequestTreeProvider);

  vscode.authentication.onDidChangeSessions(AppContext.onDidChangeSessionsListener);

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
