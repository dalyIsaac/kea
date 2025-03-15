import * as vscode from "vscode";
import { CommentTreeItem } from "./comment-tree-item";

export class ReviewCommentTreeItem extends CommentTreeItem {
  override contextValue = "review-comment";
  override iconPath = new vscode.ThemeIcon("comment-discussion");
  override tooltip = "Review Comment";
}
