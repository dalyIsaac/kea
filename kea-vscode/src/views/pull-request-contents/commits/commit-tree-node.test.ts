import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { IKeaRepository } from "../../../repository/kea-repository";
import { createCommitCommentStub, createCommitStub, createFileStub, createRepositoryStub, createUserStub } from "../../../test-utils";
import { Commit, CommitComment, CommitFile } from "../../../types/kea";
import { FileTreeNodeType, RemoteFileTreeNode } from "../../common/file-tree-node";
import { FolderTreeNodeType, RemoteFolderTreeNode } from "../../common/folder-tree-node";
import { ReviewCommentTreeNode } from "../../common/review-comment-tree-node";
import { CommitTreeNode } from "./commit-tree-node";

suite("CommitTreeNode", () => {
  let sandbox: sinon.SinonSandbox;
  let mockRepository: sinon.SinonStubbedInstance<IKeaRepository>;
  let testCommit: Commit;
  let showErrorMessageStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();
    mockRepository = createRepositoryStub() as sinon.SinonStubbedInstance<IKeaRepository>;

    testCommit = createCommitStub({
      sha: "test-sha",
      commit: {
        author: createUserStub(),
        committer: createUserStub(),
        message: "Test commit title\n\nThis is the commit body.",
        commentCount: 0,
        tree: { sha: "tree-sha", url: "tree-url" },
      },
    });

    showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
  });

  teardown(() => {
    sandbox.restore();
  });

  test("constructor and getTreeItem should create a valid tree item", () => {
    // Given
    const node = new CommitTreeNode(mockRepository, testCommit);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "Test commit title");
    assert.strictEqual(treeItem.tooltip, "Test commit title\n\nThis is the commit body.");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(treeItem.contextValue, "commit");
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("git-commit"));
  });

  test("getTreeItem should handle empty commit message", () => {
    // Given
    // Provide all required nested properties when overriding commit
    const emptyMessageCommit = createCommitStub({
      commit: {
        author: createUserStub(),
        committer: createUserStub(),
        message: "",
        commentCount: 0,
        tree: { sha: "tree-sha", url: "tree-url" },
      },
    });
    const node = new CommitTreeNode(mockRepository, emptyMessageCommit);

    // When
    const treeItem = node.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "<Empty commit>");
    assert.strictEqual(treeItem.tooltip, "");
  });

  test("getChildren should return file and folder nodes with comments", async () => {
    // Given
    const files: CommitFile[] = [
      createFileStub({ filename: "src/file1.ts" }),
      createFileStub({ filename: "src/folder/file2.ts" }),
      createFileStub({ filename: "README.md" }),
    ];
    const comments: CommitComment[] = [
      createCommitCommentStub({ path: "src/file1.ts", body: "Comment 1", line: 10 }),
      createCommitCommentStub({ path: "README.md", body: "Comment 2", line: 5 }),
    ];
    mockRepository.getCommitFiles.resolves(files);
    mockRepository.getCommitComments.resolves(comments);
    const node = new CommitTreeNode(mockRepository, testCommit);

    // When
    const children = await node.getChildren();

    // Then
    sinon.assert.calledOnceWithExactly(mockRepository.getCommitFiles, testCommit.sha);
    sinon.assert.calledOnceWithExactly(mockRepository.getCommitComments, testCommit.sha);

    assert.strictEqual(children.length, 2, "Should have one folder ('src') and one file ('README.md') at the root");

    // Then: Check README.md file node
    const readmeNode = children.find((c) => c instanceof RemoteFileTreeNode && c.fileName === "README.md") as FileTreeNodeType | undefined;
    assert.ok(readmeNode, "README.md node not found");
    const readmeComments = readmeNode.getChildren();
    assert.strictEqual(readmeComments.length, 1, "README.md should have 1 comment");
    assert.ok(readmeComments[0] instanceof ReviewCommentTreeNode, "README comment should be ReviewCommentTreeNode");
    assert.strictEqual(readmeComments[0].comment.body, "Comment 2");

    // Then: Check src folder node
    const srcFolderNode = children.find((c) => c instanceof RemoteFolderTreeNode && c.folderName === "src") as FolderTreeNodeType | undefined;
    assert.ok(srcFolderNode, "'src' folder node not found");
    const srcChildren = srcFolderNode.getChildren();
    assert.strictEqual(srcChildren.length, 2, "'src' folder should have 2 children ('file1.ts', 'folder')");

    // Then: Check src/file1.ts
    const file1Node = srcChildren.find((c) => c instanceof RemoteFileTreeNode && c.fileName === "file1.ts");
    assert.ok(file1Node, "'src/file1.ts' node not found");
    assert.ok(file1Node instanceof RemoteFileTreeNode);
    const file1Comments = file1Node.getChildren();
    assert.strictEqual(file1Comments.length, 1, "file1.ts should have 1 comment");
    assert.ok(file1Comments[0] instanceof ReviewCommentTreeNode, "file1 comment should be ReviewCommentTreeNode");
    assert.strictEqual(file1Comments[0].comment.body, "Comment 1");

    // Then: Check src/folder
    const folderNode = srcChildren.find((c) => c instanceof RemoteFolderTreeNode && c.folderName === "folder");
    assert.ok(folderNode, "'src/folder' node not found");
    assert.ok(folderNode instanceof RemoteFolderTreeNode);
    const folderChildren = folderNode.getChildren();
    assert.strictEqual(folderChildren.length, 1, "'src/folder' should have 1 child ('file2.ts')");

    // Then: Check src/folder/file2.ts
    const file2Node = folderChildren.find((c) => c instanceof RemoteFileTreeNode && c.fileName === "file2.ts");
    assert.ok(file2Node, "'src/folder/file2.ts' node not found");
    assert.ok(file2Node instanceof RemoteFileTreeNode);
    const file2Comments = file2Node.getChildren();
    assert.strictEqual(file2Comments.length, 0, "file2.ts should have 0 comments");
  });

  test("getChildren should handle error fetching files", async () => {
    // Given
    const error = new Error("Failed to fetch files");
    mockRepository.getCommitFiles.resolves(error);
    mockRepository.getCommitComments.resolves([]);
    const node = new CommitTreeNode(mockRepository, testCommit);

    // When
    const children = await node.getChildren();

    // Then
    sinon.assert.calledOnceWithExactly(mockRepository.getCommitFiles, testCommit.sha);
    sinon.assert.calledOnceWithExactly(mockRepository.getCommitComments, testCommit.sha);
    sinon.assert.calledOnce(showErrorMessageStub);
    // Check arguments directly
    assert.deepStrictEqual(showErrorMessageStub.getCall(0).args, [`Error fetching commit files: ${error.message}`]);
    assert.deepStrictEqual(children, [], "Children should be empty on file fetch error");
  });

  test("getChildren should handle error fetching comments", async () => {
    // Given
    const files: CommitFile[] = [createFileStub({ filename: "file.ts" })];
    const error = new Error("Failed to fetch comments");
    mockRepository.getCommitFiles.resolves(files);
    mockRepository.getCommitComments.resolves(error);
    const node = new CommitTreeNode(mockRepository, testCommit);

    // When
    const children = await node.getChildren();

    // Then
    sinon.assert.calledOnceWithExactly(mockRepository.getCommitFiles, testCommit.sha);
    sinon.assert.calledOnceWithExactly(mockRepository.getCommitComments, testCommit.sha);
    sinon.assert.calledOnce(showErrorMessageStub);
    // Check arguments directly
    assert.deepStrictEqual(showErrorMessageStub.getCall(0).args, [`Error fetching commit comments: ${error.message}`]);

    assert.strictEqual(children.length, 1, "Should have one file node despite comment error");
    assert.ok(children[0] instanceof RemoteFileTreeNode, "Child should be a RemoteFileTreeNode");
    const fileNode = children[0];
    assert.strictEqual(fileNode.fileName, "file.ts");
    const fileComments = fileNode.getChildren();
    assert.strictEqual(fileComments.length, 0, "File node should have no comments");
  });
});
