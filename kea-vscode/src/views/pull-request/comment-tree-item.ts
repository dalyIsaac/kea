import * as vscode from "vscode";
import { IssueComment } from "../../types/kea";

/**
 * Tree item for a comment.
 */
export class CommentTreeItem extends vscode.TreeItem {
  override contextValue = "comment";
  override iconPath = new vscode.ThemeIcon("comment");
  override tooltip = "Comment";

  constructor(comment: IssueComment) {
    super(comment.body ?? "<Empty comment>", vscode.TreeItemCollapsibleState.None);
  }
}
