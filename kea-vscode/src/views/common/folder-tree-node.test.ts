import * as assert from "assert";
import * as vscode from "vscode";
import { FileTreeNodeType } from "./file-tree-node";
import { FolderTreeNode } from "./folder-tree-node";

suite("FolderTreeNode", () => {
  test("constructor should extract folder name from path", () => {
    // Given
    const folderPath = "src/components/buttons";

    // When
    const folderTreeNode = new FolderTreeNode(folderPath);

    // Then
    assert.strictEqual(folderTreeNode.folderName, "buttons");
    assert.strictEqual(folderTreeNode.collapsibleState, "collapsed");
    assert.deepStrictEqual(folderTreeNode.children, []);
  });

  test("constructor should handle paths without separators", () => {
    // Given
    const folderPath = "components";

    // When
    const folderTreeNode = new FolderTreeNode(folderPath);

    // Then
    assert.strictEqual(folderTreeNode.folderName, "components");
  });

  test("getTreeItem should return TreeItem with correct properties", () => {
    // Given
    const folderPath = "src/views";
    const folderTreeNode = new FolderTreeNode(folderPath);

    // When
    const treeItem = folderTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "views");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(treeItem.contextValue, "folder");
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("folder"));
    assert.strictEqual(treeItem.tooltip, "Folder");
  });

  test("getTreeItem should respect custom collapsibleState", () => {
    // Given
    const folderPath = "src/models";
    const folderTreeNode = new FolderTreeNode(folderPath);
    folderTreeNode.collapsibleState = "expanded";

    // When
    const treeItem = folderTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
  });

  test("getChildren should return the children array", () => {
    // Given
    const folderPath = "src/utils";
    const folderTreeNode = new FolderTreeNode(folderPath);

    // Mock children
    const childFolder = new FolderTreeNode("src/utils/helpers");
    const childFile = {} as FileTreeNodeType; // We only need the reference, not the implementation
    folderTreeNode.children = [childFolder, childFile];

    // When
    const children = folderTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 2);
    assert.strictEqual(children[0], childFolder);
    assert.strictEqual(children[1], childFile);
  });
});
