import * as assert from "assert";
import { IAccountKey } from "../../../account/account";
import { createFileStub, createPullRequestCommentStub } from "../../../test-utils";
import { PullRequestComment, RepoId } from "../../../types/kea";
import { ReviewCommentTreeNode } from "../../common/review-comment-tree-node";
import { RemoteFileTreeNode } from "./remote-file-tree-node";

suite("FileTreeNode", () => {
  const accountKey: IAccountKey = {
    providerId: "github",
    accountId: "accountId",
  };
  const repoId: RepoId = {
    owner: "owner",
    repo: "repo",
  };

  test("FileTreeNode should be created with the name being the last part of the filename", () => {
    // Given
    const file = createFileStub({
      filename: "src/views/pull-request/file-tree-node.ts",
    });
    const comments: PullRequestComment[] = [];

    // When
    const fileTreeNode = new RemoteFileTreeNode(accountKey, repoId, file, comments);
    const treeItem = fileTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "file-tree-node.ts");
    assert.strictEqual(treeItem.tooltip, "File");
    assert.strictEqual(treeItem.description, undefined);
  });

  test("FileTreeNode should display comment count in description when comments exist", () => {
    // Given
    const file = createFileStub({
      filename: "src/views/pull-request/file-tree-node.ts",
    });

    // When - with single comment
    const singleComment: PullRequestComment[] = [createPullRequestCommentStub({ createdAt: new Date("2023-01-01") })];
    const singleCommentNode = new RemoteFileTreeNode(accountKey, repoId, file, singleComment);
    const singleCommentTreeItem = singleCommentNode.getTreeItem();

    // Then
    assert.strictEqual(singleCommentTreeItem.description, "1 comment");

    // When - with multiple comments
    const multipleComments: PullRequestComment[] = [
      createPullRequestCommentStub({ createdAt: new Date("2023-01-01") }),
      createPullRequestCommentStub({ createdAt: new Date("2023-01-02") }),
    ];
    const multipleCommentsNode = new RemoteFileTreeNode(accountKey, repoId, file, multipleComments);
    const multipleCommentsTreeItem = multipleCommentsNode.getTreeItem();

    // Then
    assert.strictEqual(multipleCommentsTreeItem.description, "2 comments");
  });

  test("FileTreeNode should contain multiple comments, sorted by createdAt", () => {
    // Given
    const file = createFileStub({
      filename: "src/views/pull-request/file-tree-Node.ts",
    });
    const comments: PullRequestComment[] = [
      createPullRequestCommentStub({ createdAt: new Date("2023-01-01") }),
      createPullRequestCommentStub({ createdAt: new Date("2023-01-02") }),
      createPullRequestCommentStub({ createdAt: new Date("2023-01-03") }),
    ];

    // When
    const fileTreeNode = new RemoteFileTreeNode(accountKey, repoId, file, comments);

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
