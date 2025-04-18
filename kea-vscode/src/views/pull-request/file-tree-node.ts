import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { createCommentDecorationUri } from "../../decorations/decoration-schemes";
import { PullRequestComment, PullRequestFile, RepoId } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

/**
 * Tree item representing a file.
 */
export class FileTreeNode implements IParentTreeNode<ReviewCommentTreeNode> {
  #contextValue = "file";
  #iconPath = new vscode.ThemeIcon("file");
  #tooltip = "File";
  #resourceUri: vscode.Uri;
  #comments: PullRequestComment[];
  fileName: string;

  collapsibleState: CollapsibleState;

  constructor(accountKey: IAccountKey, repoId: RepoId, file: PullRequestFile, comments: PullRequestComment[]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.fileName = file.filename.split("/").pop()!;
    this.collapsibleState = comments.length > 0 ? "collapsed" : "none";
    this.#resourceUri = createCommentDecorationUri({
      accountKey,
      filePath: file.filename,
      repoId,
      fileStatus: file.status,
      commentCount: comments.length,
    });

    this.#comments = comments;
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.fileName, getCollapsibleState(this.collapsibleState));
    treeItem.resourceUri = this.#resourceUri;
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;

    return treeItem;
  };

  getChildren = (): ReviewCommentTreeNode[] => {
    const commentItems = this.#comments.map((comment) => new ReviewCommentTreeNode(comment));
    return commentItems.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  };
}
