import * as vscode from "vscode";

import { AppContext } from "./core/app-context";
import { Logger } from "./core/logger";
import { PullRequestListProvider } from "./views/pull-request-list-provider";

export function activate(context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  vscode.window.registerTreeDataProvider("kea.pullRequestList", new PullRequestListProvider());
  vscode.authentication.onDidChangeSessions(AppContext.onDidChangeSessionsListener);
}

export function deactivate() {}
