import * as assert from "assert";
import { IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../../repository/kea-repository";
import {
  createIssueCommentStub,
  createPullRequestCommentStub,
  createRepositoryStub,
  createTreeNodeProviderStub,
  stubEvents,
} from "../../test-utils";
import { IssueComment, PullRequestComment, PullRequestId } from "../../types/kea";
import { CommentTreeNode } from "./comment-tree-node";
import { CommentsRootTreeNode } from "./comments-root-tree-node";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

suite("CommentsRootTreeNode", () => {
  const pullId: PullRequestId = { owner: "owner", repo: "repo", number: 1 };

  test("Returns an empty array when both API calls fail", async () => {
    // Given
    const repository = createRepositoryStub({
      getIssueComments: (_id) => Promise.resolve(new Error("Issue comments API call failed")),
      getPullRequestReviewComments: (_id) => Promise.resolve(new Error("Review comments API call failed")),
    });
    const treeNodeProvider = createTreeNodeProviderStub();

    // When
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    const children = await commentsRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Returns an empty array when both API calls return empty arrays", async () => {
    // Given
    const repository = createRepositoryStub({
      getIssueComments: (_id) => Promise.resolve<IssueComment[]>([]),
      getPullRequestReviewComments: (_id) => Promise.resolve<PullRequestComment[]>([]),
    });
    const treeNodeProvider = createTreeNodeProviderStub();

    // When
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    const children = await commentsRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Returns the issue comments when the review comments API call fails", async () => {
    // Given
    const issueComments = [
      createIssueCommentStub({ id: 1, body: "Test issue comment 1" }),
      createIssueCommentStub({ id: 2, body: "Test issue comment 2" }),
    ];

    const repository = createRepositoryStub({
      getIssueComments: (_id) => Promise.resolve<IssueComment[]>(issueComments),
      getPullRequestReviewComments: (_id) => Promise.resolve(new Error("Review comments API call failed")),
    });
    const treeNodeProvider = createTreeNodeProviderStub();

    // When
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    const children = await commentsRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 2);
    assert.ok(children[0] instanceof CommentTreeNode);
    assert.equal(children[0].comment.body, "Test issue comment 1");
  });

  test("Returns the review comments when the issue comments API call fails", async () => {
    // Given
    const reviewComments = [
      createPullRequestCommentStub({ id: 1, body: "Test review comment 1" }),
      createPullRequestCommentStub({ id: 2, body: "Test review comment 2" }),
    ];

    const repository = createRepositoryStub({
      getIssueComments: (_id) => Promise.resolve(new Error("Issue comments API call failed")),
      getPullRequestReviewComments: (_id) => Promise.resolve<PullRequestComment[]>(reviewComments),
    });
    const treeNodeProvider = createTreeNodeProviderStub();

    // When
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    const children = await commentsRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 2);
    assert.ok(children[0] instanceof ReviewCommentTreeNode);
    assert.equal(children[0].comment.body, "Test review comment 1");
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

    const repository = createRepositoryStub({
      getIssueComments: (_id) => Promise.resolve<IssueComment[]>(issueComments),
      getPullRequestReviewComments: (_id) => Promise.resolve<PullRequestComment[]>(reviewComments),
    });
    const treeNodeProvider = createTreeNodeProviderStub();

    // When
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    const children = await commentsRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 4);
    assert.ok(children[0] instanceof ReviewCommentTreeNode);
    assert.equal(children[0].comment.body, "Test review comment 2");

    assert.ok(children[1] instanceof CommentTreeNode);
    assert.equal(children[1].comment.body, "Test issue comment 1");

    assert.ok(children[2] instanceof CommentTreeNode);
    assert.equal(children[2].comment.body, "Test issue comment 2");

    assert.ok(children[3] instanceof ReviewCommentTreeNode);
    assert.equal(children[3].comment.body, "Test review comment 1");
  });

  test("Collapsible state is not updated when the issue comments errors", () => {
    // Given
    const payload: IssueCommentsPayload = { issueId: pullId, comments: new Error("Something went wrong") };
    const { stub: repository, eventFirers } = stubEvents(createRepositoryStub(), ["onDidChangeIssueComments"] as const);
    const treeNodeProvider = createTreeNodeProviderStub();
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "none");
  });

  test("Collapsible state is updated when the issue comments are empty", () => {
    // Given
    const payload: IssueCommentsPayload = { issueId: pullId, comments: [] };
    const { stub: repository, eventFirers } = stubEvents(createRepositoryStub(), ["onDidChangeIssueComments"] as const);
    const treeNodeProvider = createTreeNodeProviderStub();
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "none");
  });

  test("Collapsible state is updated when the issue comments are not empty", () => {
    // Given
    const payload: IssueCommentsPayload = { issueId: pullId, comments: [createIssueCommentStub()] };
    const { stub: repository, eventFirers } = stubEvents(createRepositoryStub(), ["onDidChangeIssueComments"] as const);
    const treeNodeProvider = createTreeNodeProviderStub();
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "collapsed");
    assert.strictEqual((treeNodeProvider.refresh as sinon.SinonStub).callCount, 1);
  });

  test("Previously set collapsible state is not overridden when the issue comments are not empty", () => {
    // Given
    const payload: IssueCommentsPayload = { issueId: pullId, comments: [createIssueCommentStub()] };
    const { stub: repository, eventFirers } = stubEvents(createRepositoryStub(), ["onDidChangeIssueComments"] as const);
    const treeNodeProvider = createTreeNodeProviderStub();
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    commentsRootTreeNode.collapsibleState = "expanded";

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "expanded");
  });

  test("Doesn't do anything for a different pull request", () => {
    // Given
    const payload: IssueCommentsPayload = { issueId: { owner: "owner", repo: "repo", number: 99 }, comments: [createIssueCommentStub()] };
    const { stub: repository, eventFirers } = stubEvents(createRepositoryStub(), ["onDidChangeIssueComments"] as const);
    const treeNodeProvider = createTreeNodeProviderStub();
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    commentsRootTreeNode.collapsibleState = "expanded";

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "expanded");
  });

  test("Collapsible state is updated when review comments are not empty", () => {
    // Given
    const payload: PullRequestReviewCommentsPayload = { pullId, comments: [createPullRequestCommentStub()] };
    const { stub: repository, eventFirers } = stubEvents(createRepositoryStub(), ["onDidChangePullRequestReviewComments"] as const);
    const treeNodeProvider = createTreeNodeProviderStub();
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangePullRequestReviewComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "collapsed");
    assert.strictEqual((treeNodeProvider.refresh as sinon.SinonStub).callCount, 1);
  });
});
