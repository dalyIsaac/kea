import * as assert from "assert";
import { IAccountKey } from "../../../account/account";
import {
  createAccountStub,
  createFileStub,
  createKeaContextStub,
  createPullRequestCommentStub,
  createRemoteRepositoryStub,
} from "../../../test-utils";
import { PullRequestComment, RepoId } from "../../../types/kea";
import { ReviewCommentTreeNode } from "../../common/review-comment-tree-node";
import { RemoteFileTreeNode } from "./remote-file-tree-node";

const createStubs = () => {
  const accountKey: IAccountKey = {
    providerId: "github",
    accountId: "accountId",
  };

  const repoId: RepoId = {
    owner: "owner",
    repo: "repo",
  };

  const remoteRepository = createRemoteRepositoryStub({
    account: createAccountStub({
      accountKey,
    }),
    repoId,
  });

  const ctx = createKeaContextStub();
  const file = createFileStub({
    filename: "src/views/pull-request/file-tree-node.ts",
  });

  return {
    remoteRepository,
    ctx,
    file,
  };
};

suite("FileTreeNode", () => {
  test("FileTreeNode should be created with the name being the last part of the filename", () => {
    // Given
    const { remoteRepository, ctx, file } = createStubs();
    const comments: PullRequestComment[] = [];

    // When
    const fileTreeNode = new RemoteFileTreeNode(ctx, remoteRepository, file, comments);
    const treeItem = fileTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "file-tree-node.ts");
    assert.strictEqual(treeItem.tooltip, "File");
    assert.strictEqual(treeItem.description, undefined);
  });

  test("FileTreeNode should display comment count in description when comments exist, for a single comment", () => {
    // Given
    const { remoteRepository, ctx, file } = createStubs();
    const comments: PullRequestComment[] = [createPullRequestCommentStub({ createdAt: new Date("2023-01-01") })];

    // When - with single comment
    const singleCommentNode = new RemoteFileTreeNode(ctx, remoteRepository, file, comments);
    const singleCommentTreeItem = singleCommentNode.getTreeItem();

    // Then
    assert.strictEqual(singleCommentTreeItem.description, "1 comment");
  });

  test("FileTreeNode should display comment count in description when comments exist, for multiple comments", () => {
    // Given
    const { remoteRepository, ctx, file } = createStubs();
    const comments: PullRequestComment[] = [
      createPullRequestCommentStub({ createdAt: new Date("2023-01-01") }),
      createPullRequestCommentStub({ createdAt: new Date("2023-01-02") }),
    ];

    // When - with multiple comments
    const multipleCommentsNode = new RemoteFileTreeNode(ctx, remoteRepository, file, comments);
    const multipleCommentsTreeItem = multipleCommentsNode.getTreeItem();

    // Then
    assert.strictEqual(multipleCommentsTreeItem.description, "2 comments");
  });

  test("FileTreeNode should contain multiple comments, sorted by createdAt", () => {
    // Given
    const { ctx, file, remoteRepository } = createStubs();
    const comments: PullRequestComment[] = [
      createPullRequestCommentStub({ createdAt: new Date("2023-01-01") }),
      createPullRequestCommentStub({ createdAt: new Date("2023-01-02") }),
      createPullRequestCommentStub({ createdAt: new Date("2023-01-03") }),
    ];

    // When
    const fileTreeNode = new RemoteFileTreeNode(ctx, remoteRepository, file, comments);

    // Then
    const children = fileTreeNode.getChildren();

    assert.strictEqual(fileTreeNode.getChildren().length, 3);

    assert.strictEqual(children[0]!.comment.createdAt.toISOString(), "2023-01-01T00:00:00.000Z");
    assert.ok(children[0] instanceof ReviewCommentTreeNode);

    assert.strictEqual(children[1]!.comment.createdAt.toISOString(), "2023-01-02T00:00:00.000Z");
    assert.ok(children[1] instanceof ReviewCommentTreeNode);

    assert.strictEqual(children[2]!.comment.createdAt.toISOString(), "2023-01-03T00:00:00.000Z");
    assert.ok(children[2] instanceof ReviewCommentTreeNode);
  });
});
