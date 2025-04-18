import * as vscode from "vscode";
import { PullRequestComment } from "../../types/kea";
import { ITreeNode } from "../tree-node";

export class ReviewCommentTreeNode implements ITreeNode {
  #contextValue = "review-comment";
  #iconPath = new vscode.ThemeIcon("comment-discussion");
  #tooltip = "Review Comment";
  readonly comment: PullRequestComment;

  constructor(comment: PullRequestComment) {
    this.comment = comment;
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.comment.body ?? "<Empty comment>", vscode.TreeItemCollapsibleState.None);
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;
    return treeItem;
  };
}
