import * as vscode from "vscode";

/**
 * Parent tree item for comments.
 */
export class CommentsRootTreeItem extends vscode.TreeItem {
  contextValue = "comment";
  iconPath = new vscode.ThemeIcon("comment-discussion");
  tooltip = "Comments";

  constructor() {
    super("Comments", vscode.TreeItemCollapsibleState.Collapsed);
  }
}
