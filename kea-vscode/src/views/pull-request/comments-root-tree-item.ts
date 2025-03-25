import * as vscode from "vscode";
import { Logger } from "../../core/logger";
import { createCommentsRootDecorationUri } from "../../decorations/decoration-schemes";
import { IKeaRepository, IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../../repository/kea-repository";
import { isSamePullRequest } from "../../type-utils";
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
  override resourceUri: vscode.Uri;

  #repository: IKeaRepository;
  #pullId: PullRequestId;

  constructor(repository: IKeaRepository, id: PullRequestId) {
    super("Comments", vscode.TreeItemCollapsibleState.None);
    this.#repository = repository;
    this.#pullId = id;

    this.resourceUri = createCommentsRootDecorationUri({
      authSessionAccountId: this.#repository.authSessionAccountId,
      pullId: this.#pullId,
    });

    // TODO: Make disposable
    this.#repository.onDidChangeIssueComments(this.#onDidChangeIssueComments);
    this.#repository.onDidChangePullRequestReviewComments(this.#onDidChangePullRequestReviewComments);
  }

  getChildren = async (): Promise<CommentTreeItem[]> => {
    const [reviewComments, issueComments] = await Promise.all([
      this.#repository.getPullRequestReviewComments(this.#pullId),
      this.#repository.getIssueComments(this.#pullId),
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

  #onDidChangeIssueComments = (payload: IssueCommentsPayload): void => {
    this.#updateCollapsibleState(payload.issueId, payload);
  };

  #onDidChangePullRequestReviewComments = (payload: PullRequestReviewCommentsPayload): void => {
    this.#updateCollapsibleState(payload.pullId, payload);
  };

  #updateCollapsibleState = (pullId: PullRequestId, payload: IssueCommentsPayload | PullRequestReviewCommentsPayload): void => {
    if (payload.comments instanceof Error) {
      Logger.error("Error fetching comments", payload);
      return;
    }

    if (!isSamePullRequest(this.#pullId, pullId)) {
      return;
    }

    const length = payload.comments.length;
    if (length === 0) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.None;
      return;
    }

    if (this.collapsibleState === vscode.TreeItemCollapsibleState.None || this.collapsibleState === undefined) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    } else {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }
  };
}
