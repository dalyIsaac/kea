import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { createCommentDecorationUri } from "../../decorations/decoration-schemes";
import { PullRequestComment, PullRequestFile, RepoId } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

/**
 * Tree item representing a file.
 */
export class FileTreeItem extends ParentTreeItem<ReviewCommentTreeNode> {
  override contextValue = "file";
  override iconPath = new vscode.ThemeIcon("file");
  override tooltip = "File";
  override resourceUri: vscode.Uri;

  #comments: PullRequestComment[];

  constructor(accountKey: IAccountKey, repoId: RepoId, file: PullRequestFile, comments: PullRequestComment[]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const name = file.filename.split("/").pop()!;
    super(name, comments.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    this.resourceUri = createCommentDecorationUri({
      accountKey,
      filePath: file.filename,
      repoId,
      fileStatus: file.status,
      commentCount: comments.length,
    });

    this.#comments = comments;
  }

  getChildren = (): ReviewCommentTreeNode[] => {
    const commentItems = this.#comments.map((comment) => new ReviewCommentTreeNode(comment));
    return commentItems.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  };
}
