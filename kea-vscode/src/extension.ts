import * as vscode from "vscode";

import { Logger } from "./logger";
import { PullRequestListProvider } from "./views/pull-request-list-provider";

export function activate(context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");
  vscode.window.registerTreeDataProvider("kea.pullRequestList", new PullRequestListProvider());
}

export function deactivate() {}
