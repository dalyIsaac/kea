import * as vscode from "vscode";

import { AppContext } from "./core/app-context";
import { Logger } from "./core/logger";
import { PullRequestListProvider } from "./views/pull-request-list-provider";

export function activate(context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  const pullRequestListProvider = new PullRequestListProvider();

  vscode.window.registerTreeDataProvider("kea.pullRequestList", pullRequestListProvider);
  vscode.authentication.onDidChangeSessions(AppContext.onDidChangeSessionsListener);

  vscode.commands.registerCommand("kea.refreshPullRequestList", () => {
    pullRequestListProvider.refresh();
  });
}

export function deactivate() {}
