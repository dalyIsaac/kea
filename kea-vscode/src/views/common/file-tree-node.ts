import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { IKeaContext } from "../../core/context";
import { createGitDecorationUri } from "../../decorations/decoration-schemes";
import { CommitFile, FileComment, RepoId } from "../../types/kea";
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
  #ctx: IKeaContext | undefined;

  #comments: FileComment[];
  fileName: string;

  collapsibleState: CollapsibleState;

  constructor(accountKey: IAccountKey, repoId: RepoId, file: CommitFile, comments: FileComment[], ctx?: IKeaContext) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.fileName = file.filename.split("/").pop()!;
    this.collapsibleState = comments.length > 0 ? "collapsed" : "none";
    this.#resourceUri = createGitDecorationUri({
      accountKey,
      filePath: file.filename,
      repoId,
      fileStatus: file.status,
    });

    this.#comments = comments;
    this.#ctx = ctx;
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.fileName, getCollapsibleState(this.collapsibleState));
    treeItem.resourceUri = this.#resourceUri;
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;

    if (this.#ctx) {
      treeItem.command = this.#ctx.commandManager.getCommand(
        "kea.openCommitFileDiff",
        "Open File Diff",
        { resourceUri: this.#resourceUri }
      );
    } else {
      treeItem.command = {
        command: "kea.openCommitFileDiff",
        title: "Open File Diff",
        arguments: [{ resourceUri: this.#resourceUri }],
      };
    }

    if (this.#comments.length > 0) {
      treeItem.description = `${this.#comments.length} comment${this.#comments.length > 1 ? "s" : ""}`;
    }

    return treeItem;
  };

  getChildren = (): ReviewCommentTreeNode[] => {
    const commentItems = this.#comments.map((comment) => new ReviewCommentTreeNode(comment));
    return commentItems.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  };
}
