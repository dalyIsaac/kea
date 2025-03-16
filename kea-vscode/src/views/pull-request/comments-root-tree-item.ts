import * as vscode from "vscode";
import { IAccount } from "../../account/account";
import { Logger } from "../../core/logger";
import { PullRequestId } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { CommentTreeItem } from "./comment-tree-item";
import { ReviewCommentTreeItem } from "./review-comment-tree-item";

/**
 * Parent tree item for comments.
 */
export class CommentsRootTreeItem extends ParentTreeItem<CommentTreeItem> {
  override contextValue = "comment";
  override iconPath = new vscode.ThemeIcon("comment-discussion");
  override tooltip = "Comments";

  #account: IAccount;
  #pullId: PullRequestId;

  constructor(account: IAccount, id: PullRequestId) {
    super("Comments", vscode.TreeItemCollapsibleState.Collapsed);
    this.#account = account;
    this.#pullId = id;
  }

  getChildren = async (): Promise<CommentTreeItem[]> => {
    const [reviewComments, issueComments] = await Promise.all([
      this.#account.getPullRequestReviewComments(this.#pullId),
      this.#account.getIssueComments(this.#pullId),
    ]);

    let hasFailed = false;

    let reviewCommentItems: ReviewCommentTreeItem[] = [];
    if (reviewComments instanceof Error) {
      Logger.error("Error fetching pull request review comments", reviewComments);
      hasFailed = true;
    } else {
      reviewCommentItems = reviewComments.map((comment) => new ReviewCommentTreeItem(comment));
    }

    let issueCommentItems: CommentTreeItem[] = [];
    if (issueComments instanceof Error) {
      Logger.error("Error fetching issue comments", issueComments);
      hasFailed = true;
    } else {
      issueCommentItems = issueComments.map((comment) => new CommentTreeItem(comment));
    }

    if (hasFailed) {
      vscode.window.showErrorMessage(`Error fetching pull request comments`);
    }

    const allCommentItems = [...reviewCommentItems, ...issueCommentItems];
    return allCommentItems.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  };
}
