import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { LocalCommit, LocalCommitFile } from "../../../git/local-git-repository";
import {
  createAccountStub,
  createCommandManagerStub,
  createKeaContextStub,
  createLocalRepositoryStub,
  createRemoteRepositoryStub,
} from "../../../test-utils";
import { FileComment } from "../../../types/kea";
import { LocalFileTreeNode } from "./local-file-tree-node";

const setupStubs = () => {
  const repoStub = createRemoteRepositoryStub();
  const repoId = repoStub.repoId;

  const localGitRepo = createLocalRepositoryStub();

  const testCommit: LocalCommit = {
    sha: "abc123def456",
    message: "Test commit message",
    author: "Test Author",
    date: new Date("2023-01-01T12:00:00Z"),
  };

  const accountStub = createAccountStub();
  const accountKey = accountStub.accountKey;

  const comments: FileComment[] = [];

  const ctx = createKeaContextStub({
    commandManager: createCommandManagerStub({
      getCommand: sinon.stub().returns({
        command: "kea.openCommitFileDiff",
        title: "Open File Diff",
        arguments: [{}],
      }),
    }),
  });

  return {
    ctx,
    repoId,
    localGitRepo,
    testCommit,
    accountKey,
    comments,
  };
};

suite("LocalFileTreeNode", () => {
  test("should create a valid tree item with language-specific icon", () => {
    // Given
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const commitFile: LocalCommitFile = { filePath: "src/test.ts", status: "M" };
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "test.ts");
    assert.strictEqual(treeItem.tooltip, "test.ts (M)");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
    assert.strictEqual(treeItem.contextValue, "localFile");

    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "M");
    assert.ok(treeItem.command, "Tree item should have a command");
    assert.strictEqual(treeItem.command.command, "kea.openCommitFileDiff");
  });

  test("should include status in description for all file types", () => {
    // Given
    const commitFile: LocalCommitFile = { filePath: "src/new-file.ts", status: "A" };
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "A");
  });

  test("should include status in description for modified files", () => {
    // Given
    const commitFile: LocalCommitFile = { filePath: "src/modified-file.ts", status: "M" };
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "M");
  });

  test("should include status in description for deleted files", () => {
    // Given
    const commitFile: LocalCommitFile = { filePath: "src/deleted-file.ts", status: "D" };
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "D");
  });

  test("should include status in description for renamed files", () => {
    // Given
    const commitFile: LocalCommitFile = { filePath: "src/renamed-file.ts", status: "R" };
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "R");
  });

  test("should include status in description for copied files", () => {
    // Given
    const commitFile: LocalCommitFile = { filePath: "src/copied-file.ts", status: "C" };
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "C");
  });

  test("should handle file names with multiple extensions", () => {
    // Given
    const commitFile: LocalCommitFile = { filePath: "src/test.spec.ts", status: "M" };
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "test.spec.ts");
    assert.strictEqual(node.fileName, "test.spec.ts");
  });

  test("should handle files at root level", () => {
    // Given
    const commitFile: LocalCommitFile = { filePath: "README.md", status: "M" };
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "README.md");
    assert.strictEqual(node.fileName, "README.md");
  });

  test("should set up command with correct arguments", () => {
    // Given
    const commitFile: LocalCommitFile = { filePath: "src/example.ts", status: "M" };
    const { ctx, localGitRepo, testCommit, comments } = setupStubs();
    const node = new LocalFileTreeNode(ctx, localGitRepo, testCommit, commitFile, comments);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.ok(treeItem.command, "Command should be set");
    assert.strictEqual(treeItem.command.command, "kea.openCommitFileDiff");
    assert.strictEqual(treeItem.command.title, "Open File Diff");
    assert.ok(Array.isArray(treeItem.command.arguments), "Command arguments should be an array");
    assert.strictEqual(treeItem.command.arguments.length, 1, "Should have one argument object");

    const commandArgs = treeItem.command.arguments[0] as Record<string, unknown>;
    assert.strictEqual(commandArgs.commitSha, testCommit.sha);
    assert.strictEqual(commandArgs.filePath, "src/example.ts");
    assert.strictEqual(commandArgs.workspacePath, localGitRepo.path);
    assert.strictEqual(commandArgs.localGitRepo, localGitRepo);
  });
});
