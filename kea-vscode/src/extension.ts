import * as vscode from "vscode";
import { PullRequestListProvider } from "./views/pull-request-list-provider";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.registerTreeDataProvider("kea.pullRequestList", new PullRequestListProvider());
}

export function deactivate() {}
