import * as vscode from "vscode";
import { IssueComment } from "../../types/kea";
import { ITreeNode } from "../tree-node";

/**
 * Tree item for a comment.
 */
export class CommentTreeNode implements ITreeNode {
  #contextValue = "comment";
  #iconPath = new vscode.ThemeIcon("comment");
  #tooltip = "Comment";
  readonly comment: IssueComment;

  constructor(comment: IssueComment) {
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
