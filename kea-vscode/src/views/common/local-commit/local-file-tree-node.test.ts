import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { IAccountKey } from "../../../account/account";
import { IKeaContext } from "../../../core/context";
import { ILocalGitRepository, LocalCommit } from "../../../git/local-git-repository";
import { RepoId } from "../../../types/kea";
import { createAccountStub, createKeaContextStub, createRepositoryStub } from "../../../test-utils";
import { LocalFileTreeNode } from "./local-file-tree-node";

suite("LocalFileTreeNode", () => {
  let sandbox: sinon.SinonSandbox;
  let mockLocalGitRepo: sinon.SinonStubbedInstance<ILocalGitRepository>;
  let testCommit: LocalCommit;
  let workspaceFolder: vscode.WorkspaceFolder;
  let mockContext: IKeaContext;
  let accountKey: IAccountKey;
  let repoId: RepoId;

  setup(() => {
    sandbox = sinon.createSandbox();
    
    mockLocalGitRepo = {} as sinon.SinonStubbedInstance<ILocalGitRepository>;

    testCommit = {
      sha: "abc123def456",
      message: "Test commit message",
      author: "Test Author",
      date: new Date("2023-01-01T12:00:00Z"),
    };

    workspaceFolder = {
      uri: vscode.Uri.file("/test/workspace"),
      name: "test-workspace",
      index: 0,
    };

    mockContext = createKeaContextStub();
    
    // Configure the command manager to return a proper command
    (mockContext.commandManager.getCommand as sinon.SinonStub).returns({
      command: "kea.openCommitFileDiff",
      title: "Open File Diff",
      arguments: [{}]
    });
    
    const accountStub = createAccountStub();
    accountKey = accountStub.accountKey;
    
    const repoStub = createRepositoryStub();
    repoId = repoStub.repoId;
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should create a valid tree item with language-specific icon", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/test.ts", "unknown", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "test.ts");
    assert.strictEqual(treeItem.tooltip, "src/test.ts (unknown)");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
    assert.strictEqual(treeItem.contextValue, "localFile");
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "unknown");
    assert.ok(treeItem.command, "Tree item should have a command");
    assert.strictEqual(treeItem.command.command, "kea.openCommitFileDiff");
  });

  test("should include status in description for all file types", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/new-file.ts", "A", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "A");
  });

  test("should include status in description for modified files", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/modified-file.ts", "M", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "M");
  });

  test("should include status in description for deleted files", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/deleted-file.ts", "D", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "D");
  });

  test("should include status in description for renamed files", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/renamed-file.ts", "R", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "R");
  });

  test("should include status in description for copied files", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/copied-file.ts", "C", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    // The icon should be determined by VS Code based on file extension via resourceUri
    assert.ok(treeItem.resourceUri);
    assert.strictEqual(treeItem.description, "C");
  });

  test("should handle file names with multiple extensions", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/test.spec.ts", "M", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "test.spec.ts");
    assert.strictEqual(node.fileName, "test.spec.ts");
  });

  test("should handle files at root level", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "README.md", "M", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "README.md");
    assert.strictEqual(node.fileName, "README.md");
    assert.strictEqual(node.filePath, "README.md");
  });

  test("should set up command with correct arguments", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/example.ts", "M", mockContext, accountKey, repoId);

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
    assert.strictEqual(commandArgs.workspacePath, workspaceFolder.uri.fsPath);
    assert.strictEqual(commandArgs.localGitRepo, mockLocalGitRepo);
  });

  test("should handle long status names for word-based statuses", () => {
    // Given
    const node = new LocalFileTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, "src/test.ts", "added", mockContext, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("diff-added"));
    assert.strictEqual(treeItem.description, "added");
  });
});