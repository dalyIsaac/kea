import * as assert from "assert";
import * as vscode from "vscode";
import { createIssueCommentStub } from "../../test-utils";
import { CommentTreeNode } from "./comment-tree-node";

suite("CommentTreeNode", () => {
  test("should be created with the correct comment", () => {
    // Given
    const comment = createIssueCommentStub({ body: "Test comment" });

    // When
    const commentTreeNode = new CommentTreeNode(comment);

    // Then
    assert.strictEqual(commentTreeNode.comment, comment);
  });

  test("getTreeItem should return TreeItem with correct properties", () => {
    // Given
    const comment = createIssueCommentStub({ body: "Test comment" });
    const commentTreeNode = new CommentTreeNode(comment);

    // When
    const treeItem = commentTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "Test comment");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
    assert.strictEqual(treeItem.contextValue, "comment");
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("comment"));
    assert.strictEqual(treeItem.tooltip, "Comment");
  });

  test("getTreeItem should handle empty comment body", () => {
    // Given
    const comment = createIssueCommentStub({ body: null });
    const commentTreeNode = new CommentTreeNode(comment);

    // When
    const treeItem = commentTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "<Empty comment>");
  });
});
