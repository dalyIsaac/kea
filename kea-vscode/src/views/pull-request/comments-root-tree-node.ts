import * as vscode from "vscode";
import { Logger } from "../../core/logger";
import { createCommentsRootDecorationUri } from "../../decorations/decoration-schemes";
import { IKeaRepository, IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../../repository/kea-repository";
import { isSamePullRequest } from "../../type-utils";
import { PullRequestId } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { CommentTreeNode } from "./comment-tree-node";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

/**
 * Parent tree node for comments.
 */
export class CommentsRootTreeNode implements IParentTreeNode<CommentTreeNode | ReviewCommentTreeNode> {
  #label = "Comments";
  #resourceUri: vscode.Uri;
  #repository: IKeaRepository;
  #pullId: PullRequestId;

  collapsibleState: CollapsibleState = "none";

  constructor(repository: IKeaRepository, id: PullRequestId) {
    this.#repository = repository;
    this.#pullId = id;

    this.#resourceUri = createCommentsRootDecorationUri({
      accountKey: this.#repository.account.accountKey,
      pullId: this.#pullId,
    });

    // TODO: Make disposable
    this.#repository.onDidChangeIssueComments(this.#onDidChangeIssueComments);
    this.#repository.onDidChangePullRequestReviewComments(this.#onDidChangePullRequestReviewComments);
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.#label, getCollapsibleState(this.collapsibleState));
    treeItem.resourceUri = this.#resourceUri;
    treeItem.contextValue = "commentsRoot";
    return treeItem;
  };

  getChildren = async (): Promise<Array<CommentTreeNode | ReviewCommentTreeNode>> => {
    const [reviewComments, issueComments] = await Promise.all([
      this.#repository.getPullRequestReviewComments(this.#pullId),
      this.#repository.getIssueComments(this.#pullId),
    ]);

    let hasFailed = false;

    let reviewCommentNodes: ReviewCommentTreeNode[] = [];
    if (reviewComments instanceof Error) {
      Logger.error("Error fetching pull request review comments", reviewComments);
      hasFailed = true;
    } else {
      reviewCommentNodes = reviewComments.map((comment) => new ReviewCommentTreeNode(comment));
    }

    let issueCommentNodes: CommentTreeNode[] = [];
    if (issueComments instanceof Error) {
      Logger.error("Error fetching issue comments", issueComments);
      hasFailed = true;
    } else {
      issueCommentNodes = issueComments.map((comment) => new CommentTreeNode(comment));
    }

    if (hasFailed) {
      vscode.window.showErrorMessage(`Error fetching pull request comments`);
    }

    const allCommentNodes = [...reviewCommentNodes, ...issueCommentNodes];
    return allCommentNodes.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
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
      this.collapsibleState = "none";
      return;
    }

    if (this.collapsibleState === "none") {
      this.collapsibleState = "collapsed";
    } else {
      this.collapsibleState = "expanded";
    }
  };
}
