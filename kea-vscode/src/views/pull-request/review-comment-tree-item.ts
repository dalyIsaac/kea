import * as vscode from "vscode";
import { PullRequestComment } from "../../types/kea";

export class ReviewCommentTreeItem extends vscode.TreeItem {
  override contextValue = "review-comment";
  override iconPath = new vscode.ThemeIcon("comment-discussion");
  override tooltip = "Review Comment";

  comment: PullRequestComment;

  constructor(comment: PullRequestComment) {
    super(comment.body ?? "<Empty comment>", vscode.TreeItemCollapsibleState.None);
    this.comment = comment;
  }
}
