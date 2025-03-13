import * as vscode from "vscode";
import { IAccount } from "../../account/account";
import { PullRequestId } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { CommentTreeItem } from "./comment-tree-item";
import { ReviewCommentTreeItem } from "./review-comment-tree-item";

/**
 * Parent tree item for comments.
 */
export class CommentsRootTreeItem extends ParentTreeItem<CommentTreeItem> {
  // Overrides.
  contextValue = "comment";
  iconPath = new vscode.ThemeIcon("comment-discussion");
  tooltip = "Comments";

  // Properties.
  #account: IAccount;
  #pullId: PullRequestId;

  constructor(account: IAccount, id: PullRequestId) {
    super("Comments", vscode.TreeItemCollapsibleState.Collapsed);
    this.#account = account;
    this.#pullId = id;
  }

  getChildren = async (): Promise<CommentTreeItem[]> => {
    const reviewComments = await this.#account.getPullRequestReviewComments(this.#pullId);
    if (reviewComments instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching review comments: ${reviewComments.message}`);
      return [];
    }

    const reviewCommentItems = reviewComments.map((comment) => new ReviewCommentTreeItem(comment));

    const issueComments = await this.#account.getIssueComments(this.#pullId);
    let issueCommentItems: CommentTreeItem[] = [];
    if (issueComments instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching issue comments: ${issueComments.message}`);
    } else {
      issueCommentItems = issueComments.map((comment) => new CommentTreeItem(comment));
    }

    return [...reviewCommentItems, ...issueCommentItems];
  };
}
