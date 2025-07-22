import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { IAccountKey } from "../../../account/account";
import { ILocalGitRepository, LocalCommit, LocalCommitFile } from "../../../git/local-git-repository";
import { createAccountStub, createKeaContextStub, createRemoteRepositoryStub } from "../../../test-utils";
import { RepoId } from "../../../types/kea";
import { LocalCommitTreeNode } from "./local-commit-tree-node";
import { LocalFileTreeNode } from "./local-file-tree-node";
import { LocalFolderTreeNode } from "./local-folder-tree-node";

suite("LocalCommitTreeNode", () => {
  let sandbox: sinon.SinonSandbox;
  let mockLocalGitRepo: sinon.SinonStubbedInstance<ILocalGitRepository>;
  let testCommit: LocalCommit;
  let workspaceFolder: vscode.WorkspaceFolder;
  let showErrorMessageStub: sinon.SinonStub;
  let accountKey: IAccountKey;
  let repoId: RepoId;

  setup(() => {
    sandbox = sinon.createSandbox();

    mockLocalGitRepo = {
      getCommitFiles: sandbox.stub(),
    } as unknown as sinon.SinonStubbedInstance<ILocalGitRepository>;

    testCommit = {
      sha: "abc123def456",
      message: "Test commit message\n\nThis is the commit body.",
      author: "Test Author",
      date: new Date("2023-01-01T12:00:00Z"),
    };

    workspaceFolder = {
      uri: vscode.Uri.file("/test/workspace"),
      name: "test-workspace",
      index: 0,
    };

    showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");

    const accountStub = createAccountStub();
    accountKey = accountStub.accountKey;

    const repoStub = createRemoteRepositoryStub();
    repoId = repoStub.repoId;
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should create a valid tree item", () => {
    // Given
    const ctx = createKeaContextStub();
    const node = new LocalCommitTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, ctx, accountKey, repoId);

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
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("git-commit"));
    assert.strictEqual(treeItem.description, "abc123d");
  });

  test("should handle empty commit message", () => {
    // Given
    const ctx = createKeaContextStub();
    const emptyCommit: LocalCommit = {
      ...testCommit,
      message: "",
    };
    const node = new LocalCommitTreeNode(mockLocalGitRepo, emptyCommit, workspaceFolder, ctx, accountKey, repoId);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "<Empty commit>");
  });

  test("should return empty array when getCommitFiles fails", async () => {
    // Given
    const ctx = createKeaContextStub();
    const error = new Error("Failed to get commit files");
    mockLocalGitRepo.getCommitFiles.resolves(error);
    const node = new LocalCommitTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, ctx, accountKey, repoId);

    // When
    const children = await node.getChildren();

    // Then
    assert.ok(mockLocalGitRepo.getCommitFiles.calledOnceWithExactly(testCommit.sha));
    sinon.assert.calledOnce(showErrorMessageStub);
    assert.deepStrictEqual(showErrorMessageStub.getCall(0).args, [`Error fetching commit files: ${error.message}`]);
    assert.deepStrictEqual(children, []);
  });

  test("should create file tree from commit files", async () => {
    // Given
    const ctx = createKeaContextStub();
    const files: LocalCommitFile[] = [
      { filePath: "README.md", status: "M" },
      { filePath: "src/file1.ts", status: "A" },
      { filePath: "src/subfolder/file2.ts", status: "D" },
    ];
    mockLocalGitRepo.getCommitFiles.resolves(files);
    const node = new LocalCommitTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, ctx, accountKey, repoId);

    // When
    const children = await node.getChildren();

    // Then
    assert.ok(mockLocalGitRepo.getCommitFiles.calledOnceWithExactly(testCommit.sha));
    assert.strictEqual(children.length, 2, "Should have one file ('README.md') and one folder ('src') at the root");

    // Check README.md file node.
    const readmeNode = children.find((c): c is LocalFileTreeNode => c instanceof LocalFileTreeNode && c.fileName === "README.md");
    assert.ok(readmeNode, "README.md node not found");
    assert.strictEqual(readmeNode.filePath, "README.md");
    assert.strictEqual(readmeNode.status, "M");

    // Check src folder node.
    const srcFolderNode = children.find((c): c is LocalFolderTreeNode => c instanceof LocalFolderTreeNode && c.folderName === "src");
    assert.ok(srcFolderNode, "'src' folder node not found");
    const srcChildren = srcFolderNode.children;
    assert.strictEqual(srcChildren.length, 2, "'src' folder should have 2 children ('file1.ts', 'subfolder')");

    // Check src/file1.ts.
    const file1Node = srcChildren.find((c) => c instanceof LocalFileTreeNode && c.fileName === "file1.ts") as LocalFileTreeNode | undefined;
    assert.ok(file1Node, "'src/file1.ts' node not found");
    assert.strictEqual(file1Node.filePath, "src/file1.ts");
    assert.strictEqual(file1Node.status, "A");

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
    assert.strictEqual(file2Node.filePath, "src/subfolder/file2.ts");
    assert.strictEqual(file2Node.status, "D");
  });

  test("should handle duplicate file names in different folders", async () => {
    // Given
    const ctx = createKeaContextStub();
    const files: LocalCommitFile[] = [
      { filePath: "src/test.ts", status: "M" },
      { filePath: "tests/test.ts", status: "A" },
    ];
    mockLocalGitRepo.getCommitFiles.resolves(files);
    const node = new LocalCommitTreeNode(mockLocalGitRepo, testCommit, workspaceFolder, ctx, accountKey, repoId);

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
