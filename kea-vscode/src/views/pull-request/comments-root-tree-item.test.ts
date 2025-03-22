import * as assert from "assert";
import { createAccountStub, createIssueCommentStub, createPullRequestCommentStub } from "../../test-utils";
import { IssueComment, PullRequestComment, PullRequestId } from "../../types/kea";
import { CommentTreeItem } from "./comment-tree-item";
import { CommentsRootTreeItem } from "./comments-root-tree-item";
import { ReviewCommentTreeItem } from "./review-comment-tree-item";

suite("CommentsRootTreeItem", () => {
  const pullId: PullRequestId = { owner: "owner", repo: "repo", number: 1 };

  test("Returns an empty array when both API calls fail", async () => {
    // Given
    const account = createAccountStub({
      getIssueComments: (_id) => Promise.resolve(new Error("Issue comments API call failed")),
      getPullRequestReviewComments: (_id) => Promise.resolve(new Error("Review comments API call failed")),
    });

    // When
    const commentsRootTreeItem = new CommentsRootTreeItem(account, pullId);
    const children = await commentsRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Returns an empty array when both API calls return empty arrays", async () => {
    // Given
    const account = createAccountStub({
      getIssueComments: (_id) => Promise.resolve<IssueComment[]>([]),
      getPullRequestReviewComments: (_id) => Promise.resolve<PullRequestComment[]>([]),
    });

    // When
    const commentsRootTreeItem = new CommentsRootTreeItem(account, pullId);
    const children = await commentsRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Returns the issue comments when the review comments API call fails", async () => {
    // Given
    const issueComments = [
      createIssueCommentStub({ id: 1, body: "Test issue comment 1" }),
      createIssueCommentStub({ id: 2, body: "Test issue comment 2" }),
    ];

    const account = createAccountStub({
      getIssueComments: (_id) => Promise.resolve<IssueComment[]>(issueComments),
      getPullRequestReviewComments: (_id) => Promise.resolve(new Error("Review comments API call failed")),
    });

    // When
    const commentsRootTreeItem = new CommentsRootTreeItem(account, pullId);
    const children = await commentsRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 2);
    assert.ok(children[0] instanceof CommentTreeItem);
    assert.equal(children[0].label, "Test issue comment 1");
  });

  test("Returns the review comments when the issue comments API call fails", async () => {
    // Given
    const reviewComments = [
      createPullRequestCommentStub({ id: 1, body: "Test review comment 1" }),
      createPullRequestCommentStub({ id: 2, body: "Test review comment 2" }),
    ];

    const account = createAccountStub({
      getIssueComments: (_id) => Promise.resolve(new Error("Issue comments API call failed")),
      getPullRequestReviewComments: (_id) => Promise.resolve<PullRequestComment[]>(reviewComments),
    });

    // When
    const commentsRootTreeItem = new CommentsRootTreeItem(account, pullId);
    const children = await commentsRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 2);
    assert.ok(children[0] instanceof ReviewCommentTreeItem);
    assert.equal(children[0].label, "Test review comment 1");
  });

  test("Returns multiple comments", async () => {
    // Given
    const issueComments = [
      createIssueCommentStub({ id: 1, body: "Test issue comment 1", createdAt: new Date("2023-01-01") }),
      createIssueCommentStub({ id: 2, body: "Test issue comment 2", createdAt: new Date("2023-01-02") }),
    ];

    const reviewComments = [
      createPullRequestCommentStub({ id: 3, body: "Test review comment 1", createdAt: new Date("2023-01-03") }),
      createPullRequestCommentStub({ id: 4, body: "Test review comment 2", createdAt: new Date("2022-01-04") }),
    ];

    const account = createAccountStub({
      getIssueComments: (_id) => Promise.resolve<IssueComment[]>(issueComments),
      getPullRequestReviewComments: (_id) => Promise.resolve<PullRequestComment[]>(reviewComments),
    });

    // When
    const commentsRootTreeItem = new CommentsRootTreeItem(account, pullId);
    const children = await commentsRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 4);
    assert.ok(children[0] instanceof ReviewCommentTreeItem);
    assert.equal(children[0].label, "Test review comment 2");

    assert.ok(children[1] instanceof CommentTreeItem);
    assert.equal(children[1].label, "Test issue comment 1");

    assert.ok(children[2] instanceof CommentTreeItem);
    assert.equal(children[2].label, "Test issue comment 2");

    assert.ok(children[3] instanceof ReviewCommentTreeItem);
    assert.equal(children[3].label, "Test review comment 1");
  });
});
