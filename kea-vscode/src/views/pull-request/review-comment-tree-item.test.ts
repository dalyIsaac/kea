import * as assert from "assert";
import { createPullRequestCommentStub } from "../../test-utils";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

suite("ReviewCommentTreeNode", () => {
  test("ReviewCommentTreeNode should be created with a comment", () => {
    // Given
    const comment = createPullRequestCommentStub();

    // When
    const reviewCommentTreeNode = new ReviewCommentTreeNode(comment);
    const treeItem = reviewCommentTreeNode.getTreeItem();

    // Then
    assert.strictEqual(reviewCommentTreeNode.comment, comment);
    assert.strictEqual(treeItem.label, comment.body);
    assert.strictEqual(treeItem.tooltip, "Review Comment");
  });

  test("ReviewCommentTreeNode should be created with an empty comment", () => {
    // Given
    const comment = createPullRequestCommentStub({ body: null });

    // When
    const reviewCommentTreeNode = new ReviewCommentTreeNode(comment);
    const treeItem = reviewCommentTreeNode.getTreeItem();

    // Then
    assert.strictEqual(reviewCommentTreeNode.comment, comment);
    assert.strictEqual(treeItem.label, "<Empty comment>");
  });
});
