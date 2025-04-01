import * as assert from "assert";
import { createPullRequestCommentStub } from "../../test-utils";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

suite("ReviewCommentTreeItem", () => {
  test("ReviewCommentTreeItem should be created with a comment", () => {
    // Given
    const comment = createPullRequestCommentStub();

    // When
    const reviewCommentTreeItem = new ReviewCommentTreeNode(comment);

    // Then
    assert.strictEqual(reviewCommentTreeItem.comment, comment);
    assert.strictEqual(reviewCommentTreeItem.label, comment.body);
    assert.strictEqual(reviewCommentTreeItem.tooltip, "Review Comment");
  });

  test("ReviewCommentTreeItem should be created with an empty comment", () => {
    // Given
    const comment = createPullRequestCommentStub({ body: null });

    // When
    const reviewCommentTreeItem = new ReviewCommentTreeNode(comment);

    // Then
    assert.strictEqual(reviewCommentTreeItem.comment, comment);
    assert.strictEqual(reviewCommentTreeItem.label, "<Empty comment>");
  });
});
