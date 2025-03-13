import * as vscode from "vscode";

export class PullRequestTreeItem extends vscode.TreeItem {
  contextValue = "pullRequest";

  constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
}
