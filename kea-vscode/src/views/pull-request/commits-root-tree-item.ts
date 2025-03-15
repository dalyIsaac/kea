import * as vscode from "vscode";

/**
 * Provides information about the commits in the current pull request.
 */
export class CommitsRootTreeItem extends vscode.TreeItem {
  override contextValue = "commit";
  override iconPath = new vscode.ThemeIcon("git-commit");

  constructor() {
    super("Commits", vscode.TreeItemCollapsibleState.Collapsed);
  }
}
