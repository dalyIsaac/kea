import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { LocalCommit, LocalCommitFile } from "../../../git/local-git-repository";
import { createKeaContextStub, createLocalRepositoryStub, createRepositoryStub } from "../../../test-utils";
import { FileStatus } from "../../../types/kea";
import { LocalCommitTreeNode } from "./local-commit-tree-node";
import { LocalFileTreeNode } from "./local-file-tree-node";
import { LocalFolderTreeNode } from "./local-folder-tree-node";

const setupStubs = (
  stubs: {
    getCommitFiles?: LocalCommitFile[] | Error;
  } = {},
) => {
  const repository = createRepositoryStub({
    localRepository: createLocalRepositoryStub({
      getCommitFiles: sinon.stub().resolves(stubs.getCommitFiles ?? []),
    }),
  });

  const testCommit: LocalCommit = {
    sha: "abc123def456",
    message: "Test commit message\n\nThis is the commit body.",
    author: "Test Author",
    date: new Date("2023-01-01T12:00:00Z"),
  };

  const ctx = createKeaContextStub();

  return {
    repository,
    testCommit,
    ctx,
  };
};

suite("LocalCommitTreeNode", () => {
  test("should create a valid tree item", () => {
    // Given
    const { ctx, repository, testCommit } = setupStubs();
    const node = new LocalCommitTreeNode(ctx, repository, testCommit);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "Test commit message");
    assert.strictEqual(
      treeItem.tooltip,
      "Test commit message\n\nThis is the commit body.\n\nAuthor: Test Author\nDate: 1/1/2023, 11:00:00 PM\nSHA: abc123def456",
    );
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(treeItem.contextValue, "localCommit");
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("git-branch"));
    assert.strictEqual(treeItem.description, "abc123d");
  });

  test("should handle empty commit message", () => {
    // Given
    const { ctx, repository } = setupStubs();
    const emptyCommit: LocalCommit = {
      sha: "abc123def456",
      message: "",
      author: "Test Author",
      date: new Date("2023-01-01T12:00:00Z"),
    };
    const node = new LocalCommitTreeNode(ctx, repository, emptyCommit);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "<Empty commit>");
  });

  test("should return empty array when getCommitFiles fails", async () => {
    // Given
    const error = new Error("Failed to get commit files");
    const { ctx, repository, testCommit } = setupStubs({
      getCommitFiles: error,
    });
    const node = new LocalCommitTreeNode(ctx, repository, testCommit);

    // When
    const children = await node.getChildren();

    // Then
    assert.deepStrictEqual(children, []);
  });

  test("should create file tree from commit files", async () => {
    // Given
    const files: LocalCommitFile[] = [
      { filePath: "README.md", status: "M" },
      { filePath: "src/file1.ts", status: "A" },
      { filePath: "src/subfolder/file2.ts", status: "D" },
    ];
    const { ctx, repository, testCommit } = setupStubs({ getCommitFiles: files });
    const node = new LocalCommitTreeNode(ctx, repository, testCommit);

    // When
    const children = await node.getChildren();

    // Then
    assert.strictEqual(children.length, 2, "Should have one file ('README.md') and one folder ('src') at the root");

    // Check README.md file node.
    const readmeNode = children.find((c): c is LocalFileTreeNode => c instanceof LocalFileTreeNode && c.fileName === "README.md");
    assert.ok(readmeNode, "README.md node not found");
    verifyNodeTreeItem(readmeNode, "README.md", "M");

    // Check src folder node.
    const srcFolderNode = children.find((c): c is LocalFolderTreeNode => c instanceof LocalFolderTreeNode && c.folderName === "src");
    assert.ok(srcFolderNode, "'src' folder node not found");
    const srcChildren = srcFolderNode.children;
    assert.strictEqual(srcChildren.length, 2, "'src' folder should have 2 children ('file1.ts', 'subfolder')");

    // Check src/file1.ts.
    const file1Node = srcChildren.find((c) => c instanceof LocalFileTreeNode && c.fileName === "file1.ts") as LocalFileTreeNode | undefined;
    assert.ok(file1Node, "'src/file1.ts' node not found");
    verifyNodeTreeItem(file1Node, "file1.ts", "A");

    // Check src/subfolder.
    const subfolderNode = srcChildren.find((c) => c instanceof LocalFolderTreeNode && c.folderName === "subfolder") as
      | LocalFolderTreeNode
      | undefined;
    assert.ok(subfolderNode, "'src/subfolder' node not found");
    const subfolderChildren = subfolderNode.children;
    assert.strictEqual(subfolderChildren.length, 1, "'src/subfolder' should have 1 child ('file2.ts')");

    // Check src/subfolder/file2.ts.
    const file2Node = subfolderChildren.find((c) => c instanceof LocalFileTreeNode && c.fileName === "file2.ts") as
      | LocalFileTreeNode
      | undefined;
    assert.ok(file2Node, "'src/subfolder/file2.ts' node not found");
    verifyNodeTreeItem(file2Node, "file2.ts", "D");
  });

  test("should handle duplicate file names in different folders", async () => {
    // Given
    const files: LocalCommitFile[] = [
      { filePath: "src/test.ts", status: "M" },
      { filePath: "tests/test.ts", status: "A" },
    ];
    const { ctx, repository, testCommit } = setupStubs({ getCommitFiles: files });
    const node = new LocalCommitTreeNode(ctx, repository, testCommit);

    // When
    const children = await node.getChildren();

    // Then
    assert.strictEqual(children.length, 2, "Should have two folders ('src' and 'tests')");

    const srcFolder = children.find((c) => c instanceof LocalFolderTreeNode && c.folderName === "src") as LocalFolderTreeNode;
    const testsFolder = children.find((c) => c instanceof LocalFolderTreeNode && c.folderName === "tests") as LocalFolderTreeNode;

    assert.ok(srcFolder, "src folder should exist");
    assert.ok(testsFolder, "tests folder should exist");

    assert.strictEqual(srcFolder.children.length, 1, "src folder should have 1 file");
    assert.strictEqual(testsFolder.children.length, 1, "tests folder should have 1 file");
  });
});

const verifyNodeTreeItem = (node: LocalFileTreeNode, filePath: string, status: FileStatus) => {
  const treeItem = node.getTreeItem();

  assert.strictEqual(treeItem.label, filePath, "Tree item label should match file name");
  assert.strictEqual(treeItem.description, status, "Tree item status should match file status");
};
