import * as vscode from "vscode";

export class PullRequestTreeItem extends vscode.TreeItem {
  // Overrides.
  contextValue = "pullRequest";

  constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
}
