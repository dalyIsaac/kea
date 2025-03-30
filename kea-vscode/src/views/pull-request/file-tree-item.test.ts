import * as assert from "assert";
import { createPullRequestCommentStub, createPullRequestFileStub } from "../../test-utils";
import { PullRequestComment, RepoId } from "../../types/kea";
import { FileTreeItem } from "./file-tree-item";
import { ReviewCommentTreeItem } from "./review-comment-tree-item";

suite("FileTreeItem", () => {
  const accountId = "1234";
  const repoId: RepoId = {
    owner: "owner",
    repo: "repo",
  };

  test("FileTreeItem should be created with the name being the last part of the filename", () => {
    // Given
    const file = createPullRequestFileStub({
      filename: "src/views/pull-request/file-tree-item.ts",
    });
    const comments: PullRequestComment[] = [];

    // When
    const fileTreeItem = new FileTreeItem(accountId, repoId, file, comments);

    // Then
    assert.strictEqual(fileTreeItem.label, "file-tree-item.ts");
    assert.strictEqual(fileTreeItem.tooltip, "File");
  });

  test("FileTreeItem should contain multiple comments, sorted by createdAt", () => {
    // Given
    const file = createPullRequestFileStub({
      filename: "src/views/pull-request/file-tree-item.ts",
    });
    const comments: PullRequestComment[] = [
      createPullRequestCommentStub({ createdAt: new Date("2023-01-01") }),
      createPullRequestCommentStub({ createdAt: new Date("2023-01-02") }),
      createPullRequestCommentStub({ createdAt: new Date("2023-01-03") }),
    ];

    // When
    const fileTreeItem = new FileTreeItem(accountId, repoId, file, comments);

    // Then
    const children = fileTreeItem.getChildren();

    assert.strictEqual(fileTreeItem.getChildren().length, 3);

    assert.strictEqual(children[0]!.comment.createdAt.toISOString(), "2023-01-01T00:00:00.000Z");
    assert.ok(children[0] instanceof ReviewCommentTreeItem);

    assert.strictEqual(children[1]!.comment.createdAt.toISOString(), "2023-01-02T00:00:00.000Z");
    assert.ok(children[1] instanceof ReviewCommentTreeItem);

    assert.strictEqual(children[2]!.comment.createdAt.toISOString(), "2023-01-03T00:00:00.000Z");
    assert.ok(children[2] instanceof ReviewCommentTreeItem);
  });
});
