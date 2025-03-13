import * as vscode from "vscode";

import { AppContext } from "./core/app-context";
import { Logger } from "./core/logger";
import { PullRequestListTreeProvider } from "./views/pull-request-list/pull-request-list-tree-provider";

export function activate(context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  // Tree providers.
  const pullRequestListTreeProvider = new PullRequestListTreeProvider();

  // Register tree providers.
  vscode.window.registerTreeDataProvider("kea.pullRequestList", pullRequestListTreeProvider);
  vscode.window.registerTreeDataProvider("kea.pullRequest", pullRequestListTreeProvider);

  vscode.authentication.onDidChangeSessions(AppContext.onDidChangeSessionsListener);

  // Commands.
  vscode.commands.registerCommand("kea.refreshPullRequestList", () => {
    pullRequestListTreeProvider.refresh();
  });
}

export function deactivate() {}
