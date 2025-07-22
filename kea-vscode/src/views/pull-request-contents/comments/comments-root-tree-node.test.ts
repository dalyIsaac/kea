import * as assert from "assert";
import * as vscode from "vscode";
import { IRemoteRepository, IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../../../repository/remote-repository";
import {
  createIssueCommentStub,
  createPullRequestCommentStub,
  createRemoteRepositoryStub,
  createRepositoryStub,
  createTreeNodeProviderStub,
  stubEvents,
} from "../../../test-utils";
import { IssueComment, PullRequestComment, PullRequestId } from "../../../types/kea";
import { CommentTreeNode } from "../../common/comment-tree-node";
import { ReviewCommentTreeNode } from "../../common/review-comment-tree-node";
import { CommentsRootTreeNode } from "./comments-root-tree-node";

const createStubs = (
  stubs: { getIssueComments?: IssueComment[] | Error; getPullRequestReviewComments?: PullRequestComment[] | Error } = {},
) => {
  const remoteRepository = createRemoteRepositoryStub({
    getIssueComments: (_id: PullRequestId) => Promise.resolve(stubs.getIssueComments ?? []),
    getPullRequestReviewComments: (_id: PullRequestId) => Promise.resolve(stubs.getPullRequestReviewComments ?? []),
  });

  const repository = createRepositoryStub({ remoteRepository });

  const pullId: PullRequestId = { owner: "owner", repo: "repo", number: 1 };
  const treeNodeProvider = createTreeNodeProviderStub();

  return { repository, pullId, treeNodeProvider };
};

const createStubsWithEvents = (
  stubs: { getIssueComments?: IssueComment[] | Error; getPullRequestReviewComments?: PullRequestComment[] | Error } = {},
  eventNames: Array<keyof IRemoteRepository>,
) => {
  const { repository, pullId, treeNodeProvider } = createStubs(stubs);
  const { eventFirers } = stubEvents(repository.remoteRepository, eventNames);

  return { repository, pullId, treeNodeProvider, eventFirers };
};

suite("CommentsRootTreeNode", () => {
  test("Returns an empty array when both API calls fail", async () => {
    // Given
    const { repository, treeNodeProvider, pullId } = createStubs({
      getIssueComments: new Error("Issue comments API call failed"),
      getPullRequestReviewComments: new Error("Review comments API call failed"),
    });

    // When
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    const children = await commentsRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Returns an empty array when both API calls return empty arrays", async () => {
    // Given
    const { repository, pullId, treeNodeProvider } = createStubs();

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

    const { repository, pullId, treeNodeProvider } = createStubs({
      getIssueComments: issueComments,
      getPullRequestReviewComments: new Error("Review comments API call failed"),
    });

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

    const { repository, pullId, treeNodeProvider } = createStubs({
      getIssueComments: new Error("Issue comments API call failed"),
      getPullRequestReviewComments: reviewComments,
    });

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

    const { repository, pullId, treeNodeProvider } = createStubs({
      getIssueComments: issueComments,
      getPullRequestReviewComments: reviewComments,
    });

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
    const { repository, pullId, treeNodeProvider, eventFirers } = createStubsWithEvents({}, ["onDidChangeIssueComments"]);
    const payload: IssueCommentsPayload = { issueId: pullId, comments: new Error("Something went wrong") };

    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "none");
  });

  test("Collapsible state is updated when the issue comments are empty", () => {
    // Given
    const { repository, pullId, treeNodeProvider, eventFirers } = createStubsWithEvents({}, ["onDidChangeIssueComments"]);
    const payload: IssueCommentsPayload = { issueId: pullId, comments: [] };

    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "none");
  });

  test("Collapsible state is updated when the issue comments are not empty", () => {
    // Given
    const { repository, eventFirers, treeNodeProvider, pullId } = createStubsWithEvents({}, ["onDidChangeIssueComments"]);
    const payload: IssueCommentsPayload = { issueId: pullId, comments: [createIssueCommentStub()] };

    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "collapsed");
    assert.strictEqual((treeNodeProvider.refresh as sinon.SinonStub).callCount, 1);
  });

  test("Previously set collapsible state is not overridden when the issue comments are not empty", () => {
    // Given
    const { repository, pullId, treeNodeProvider, eventFirers } = createStubsWithEvents({}, ["onDidChangeIssueComments"]);
    const payload: IssueCommentsPayload = { issueId: pullId, comments: [createIssueCommentStub()] };

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
    const { repository, pullId, treeNodeProvider, eventFirers } = createStubsWithEvents({}, ["onDidChangeIssueComments"]);

    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    commentsRootTreeNode.collapsibleState = "expanded";

    // When
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "expanded");
  });

  test("Collapsible state is updated when review comments are not empty", () => {
    // Given
    const { repository, pullId, treeNodeProvider, eventFirers } = createStubsWithEvents({}, ["onDidChangePullRequestReviewComments"]);
    const payload: PullRequestReviewCommentsPayload = { pullId, comments: [createPullRequestCommentStub()] };

    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangePullRequestReviewComments(payload);

    // Then
    assert.strictEqual(commentsRootTreeNode.collapsibleState, "collapsed");
    assert.strictEqual((treeNodeProvider.refresh as sinon.SinonStub).callCount, 1);
  });

  test("getTreeItem should return TreeItem with correct properties", () => {
    // Given
    const { repository, pullId, treeNodeProvider } = createStubs();
    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    const treeItem = commentsRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "Comments");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
    assert.strictEqual(treeItem.contextValue, "commentsRoot");
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("comment-discussion"));

    // Check resourceUri - it should be using the comments root decoration scheme
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.resourceUri.scheme, "kea-comments-root");
  });

  test("getTreeItem should respect custom collapsibleState", () => {
    // Given
    const { repository, pullId, treeNodeProvider } = createStubs();

    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);
    commentsRootTreeNode.collapsibleState = "expanded";

    // When
    const treeItem = commentsRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
  });

  test("getTreeItem should set description with singular form for one comment", () => {
    // Given
    const { repository, pullId, treeNodeProvider, eventFirers } = createStubsWithEvents({}, ["onDidChangeIssueComments"]);
    const payload: IssueCommentsPayload = { issueId: pullId, comments: [createIssueCommentStub()] };

    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangeIssueComments(payload); // This sets the issueCommentsCount
    const treeItem = commentsRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.description, "1 comment");
  });

  test("getTreeItem should set description with plural form for multiple comments", () => {
    // Given
    const { repository, pullId, treeNodeProvider, eventFirers } = createStubsWithEvents({}, [
      "onDidChangeIssueComments",
      "onDidChangePullRequestReviewComments",
    ]);

    const issuePayload: IssueCommentsPayload = {
      issueId: pullId,
      comments: [createIssueCommentStub(), createIssueCommentStub()],
    };
    const reviewPayload: PullRequestReviewCommentsPayload = {
      pullId,
      comments: [createPullRequestCommentStub()],
    };

    const commentsRootTreeNode = new CommentsRootTreeNode(repository, pullId, treeNodeProvider);

    // When
    eventFirers.onDidChangeIssueComments(issuePayload); // This sets the issueCommentsCount to 2
    eventFirers.onDidChangePullRequestReviewComments(reviewPayload); // This sets the reviewCommentsCount to 1
    const treeItem = commentsRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.description, "3 comments");
  });
});
