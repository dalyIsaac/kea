import * as assert from "assert";
import * as vscode from "vscode";
import { CommitsRootTreeNode } from "./commits-root-tree-node";

suite("CommitsRootTreeNode", () => {
  test("should initialize with correct default collapsible state", () => {
    // Given/When
    const commitsRootTreeNode = new CommitsRootTreeNode();

    // Then
    assert.strictEqual(commitsRootTreeNode.collapsibleState, "collapsed");
  });

  test("getTreeItem should return TreeItem with correct properties", () => {
    // Given
    const commitsRootTreeNode = new CommitsRootTreeNode();

    // When
    const treeItem = commitsRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "Commits");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(treeItem.contextValue, "commit");
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("git-commit"));
  });

  test("getTreeItem should respect custom collapsibleState", () => {
    // Given
    const commitsRootTreeNode = new CommitsRootTreeNode();
    commitsRootTreeNode.collapsibleState = "expanded";

    // When
    const treeItem = commitsRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
  });

  test("getChildren should return an empty array", () => {
    // Given
    const commitsRootTreeNode = new CommitsRootTreeNode();

    // When
    const children = commitsRootTreeNode.getChildren();

    // Then
    assert.deepStrictEqual(children, []);
  });
});
