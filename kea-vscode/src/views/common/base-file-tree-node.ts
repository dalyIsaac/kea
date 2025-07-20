import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";
import { FileComment } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

/**
 * Base class for file tree nodes with common functionality.
 */
export abstract class BaseFileTreeNode implements IParentTreeNode<ReviewCommentTreeNode> {
  #contextValue: string;
  #tooltip = "File";
  #fileUri: vscode.Uri;
  #ctx: IKeaContext | undefined;
  #comments: FileComment[];

  fileName: string;
  collapsibleState: CollapsibleState;

  protected constructor(fileName: string, fileUri: vscode.Uri, comments: FileComment[], contextValue: string, ctx?: IKeaContext) {
    this.fileName = fileName;
    this.#fileUri = fileUri;
    this.#comments = comments;
    this.#contextValue = contextValue;
    this.#ctx = ctx;
    this.collapsibleState = comments.length > 0 ? "collapsed" : "none";
  }

  protected get fileUri(): vscode.Uri {
    return this.#fileUri;
  }

  protected get comments(): FileComment[] {
    return this.#comments;
  }

  protected get ctx(): IKeaContext | undefined {
    return this.#ctx;
  }

  abstract getTreeItem(): vscode.TreeItem;

  getChildren = (): ReviewCommentTreeNode[] => {
    const commentItems = this.#comments.map((comment) => new ReviewCommentTreeNode(comment));
    return commentItems.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  };

  protected createBaseTreeItem(): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(this.fileName, getCollapsibleState(this.collapsibleState));
    treeItem.resourceUri = this.fileUri;
    treeItem.contextValue = this.#contextValue;
    treeItem.tooltip = this.#tooltip;

    if (this.#comments.length > 0) {
      treeItem.description = `${this.#comments.length} comment${this.#comments.length > 1 ? "s" : ""}`;
    }

    return treeItem;
  }
}