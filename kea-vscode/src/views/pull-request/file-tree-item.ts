import * as vscode from "vscode";
import { PullRequestComment, PullRequestFile } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { ReviewCommentTreeItem } from "./review-comment-tree-item";

/**
 * Tree item representing a file.
 */
export class FileTreeItem extends ParentTreeItem<ReviewCommentTreeItem> {
  override contextValue = "file";
  override iconPath = new vscode.ThemeIcon("file");
  override tooltip = "File";

  #comments: PullRequestComment[];

  constructor(comments: PullRequestComment[], file: PullRequestFile) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const name = file.filename.split("/").pop()!;
    super(name, comments.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    this.#comments = comments;
  }

  getChildren = (): ReviewCommentTreeItem[] => {
    const commentItems = this.#comments.map((comment) => new ReviewCommentTreeItem(comment));
    return commentItems.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  };
}
