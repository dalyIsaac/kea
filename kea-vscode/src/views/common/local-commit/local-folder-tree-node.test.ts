import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { LocalFolderTreeNode } from "./local-folder-tree-node";

const setupStubs = () => {
  const sandbox = sinon.createSandbox();

  return {
    sandbox,
  };
};

suite("LocalFolderTreeNode", () => {

  test("should create a valid tree item for folder", () => {
    // Given
    const node = new LocalFolderTreeNode("src/components");

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "components");
    assert.strictEqual(treeItem.tooltip, "Folder");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(treeItem.contextValue, "localFolder");
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("folder"));
    assert.strictEqual(node.folderName, "components");
  });

  test("should handle root level folder name", () => {
    // Given
    const node = new LocalFolderTreeNode("src");

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "src");
    assert.strictEqual(node.folderName, "src");
  });

  test("should handle empty folder path", () => {
    // Given
    const node = new LocalFolderTreeNode("");

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "");
    assert.strictEqual(node.folderName, "");
  });

  test("should handle deeply nested folder path", () => {
    // Given
    const node = new LocalFolderTreeNode("src/components/ui/buttons");

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "buttons");
    assert.strictEqual(node.folderName, "buttons");
  });

  test("should return empty children array initially", () => {
    // Given
    const node = new LocalFolderTreeNode("src");

    // When
    const children = node.getChildren();

    // Then
    assert.deepStrictEqual(children, []);
    assert.strictEqual(children.length, 0);
  });

  test("should maintain children array reference", () => {
    // Given
    const node = new LocalFolderTreeNode("src");

    // When
    const children1 = node.getChildren();
    const children2 = node.getChildren();

    // Then
    assert.strictEqual(children1, children2, "Should return the same array reference");
    assert.strictEqual(children1, node.children, "Should return the internal children array");
  });

  test("should have collapsed state by default", () => {
    // Given
    const { sandbox } = setupStubs();
    const node = new LocalFolderTreeNode("src");

    // Then
    assert.strictEqual(node.collapsibleState, "collapsed");
    sandbox.restore();
  });
});