import * as vscode from "vscode";
import { PullRequestComment } from "../../types/kea";
import { CommentTreeItem } from "./comment-tree-item";

export class ReviewCommentTreeItem extends CommentTreeItem {
  // Overrides.
  contextValue = "review-comment";
  iconPath = new vscode.ThemeIcon("comment-discussion");
  tooltip = "Review Comment";

  constructor(comment: PullRequestComment) {
    super(comment);
  }
}
