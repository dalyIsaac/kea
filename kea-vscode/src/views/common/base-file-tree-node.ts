import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";
import { FileComment, FileStatus } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

/**
 * Base class for file tree nodes with common functionality.
 */
export abstract class BaseFileTreeNode implements IParentTreeNode<ReviewCommentTreeNode> {
  protected _contextValue: string;
  protected _fileUri: vscode.Uri;
  protected _ctx: IKeaContext;
  protected _comments: FileComment[];
  protected _status: FileStatus;

  fileName: string;
  collapsibleState: CollapsibleState;

  /**
   *
   * @param ctx The Kea context.
   * @param fileName The name of the file.
   * @param fileUri The URI of the file.
   * @param comments An array of comments associated with the file.
   * @param contextValue The Context value of the tree item - see {@link vscode.TreeItem.contextValue}
   * @param status The status of the file (e.g., modified, added).
   */
  protected constructor(
    ctx: IKeaContext,
    fileName: string,
    fileUri: vscode.Uri,
    comments: FileComment[],
    contextValue: string,
    status: FileStatus,
  ) {
    this._ctx = ctx;
    this.fileName = fileName;
    this._fileUri = fileUri;
    this._comments = comments;
    this._contextValue = contextValue;
    this.collapsibleState = comments.length > 0 ? "collapsed" : "none";
    this._status = status;
  }

  abstract getTreeItem(): vscode.TreeItem;

  getChildren = (): ReviewCommentTreeNode[] => {
    const commentItems = this._comments.map((comment) => new ReviewCommentTreeNode(comment));
    return commentItems.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  };

  protected createBaseTreeItem(): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(this.fileName, getCollapsibleState(this.collapsibleState));
    treeItem.resourceUri = this._fileUri;
    treeItem.contextValue = this._contextValue;
    treeItem.tooltip = `${this.fileName} (${this._status})`;

    if (this._comments.length > 0) {
      treeItem.description = `${this._comments.length} comment${this._comments.length > 1 ? "s" : ""}`;
    }

    return treeItem;
  }
}
