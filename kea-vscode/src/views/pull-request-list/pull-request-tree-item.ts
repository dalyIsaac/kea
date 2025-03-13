import * as vscode from "vscode";

export class PullRequestTreeItem extends vscode.TreeItem {
  constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  contextValue = "pullRequest";
}
