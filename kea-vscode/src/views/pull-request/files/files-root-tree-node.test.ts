import * as assert from "assert";
import * as vscode from "vscode";
import { createFileStub, createPullRequestCommentStub, createRepositoryStub } from "../../../test-utils";
import { PullRequestId } from "../../../types/kea";
import { FileTreeNode } from "../../common/file-tree-node";
import { FolderTreeNode } from "../../common/folder-tree-node";
import { ReviewCommentTreeNode } from "../../common/review-comment-tree-node";
import { FilesRootTreeNode } from "./files-root-tree-node";

suite("FilesRootTreeNode", () => {
  const pullId: PullRequestId = { owner: "owner", repo: "repo", number: 1 };

  test("Returns an empty array when the files API call fails", async () => {
    // Given
    const repository = createRepositoryStub({
      getPullRequestFiles: (_id) => Promise.resolve(new Error("API call failed")),
    });

    // When
    const filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
    const children = await filesRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Continues to return an empty array when the review comments API call fails", async () => {
    // Given
    const repository = createRepositoryStub({
      getPullRequestFiles: (_id) => Promise.resolve([createFileStub({ filename: "README.md" })]),
      getPullRequestReviewComments: (_id) => Promise.resolve(new Error("API call failed")),
    });

    // When
    const filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
    const children = await filesRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 1);
  });

  test("Returns an empty array when there are no files", async () => {
    // Given
    const repository = createRepositoryStub({
      getPullRequestFiles: (_id) => Promise.resolve([]),
    });

    // When
    const filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
    const children = await filesRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Returns a single file when there is one file", async () => {
    // Given
    const repository = createRepositoryStub({
      getPullRequestFiles: (_id) => Promise.resolve([createFileStub({ filename: "README.md" })]),
      getPullRequestReviewComments: (_id) => Promise.resolve([]),
    });

    // When
    const filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
    const children = await filesRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 1);

    const readme = children[0]!;
    const readmeTreeItem = readme.getTreeItem();
    assert.strictEqual(readmeTreeItem.label, "README.md");
    assert.ok(readme instanceof FileTreeNode);
  });

  test("Returns a tree structure for files", async () => {
    // Given
    const repository = createRepositoryStub({
      getPullRequestFiles: (_id) =>
        Promise.resolve([
          createFileStub({ filename: "src/components/Button.tsx" }),
          createFileStub({ filename: "src/components/Modal.tsx" }),
          createFileStub({ filename: "src/utils/helpers.ts" }),
          createFileStub({ filename: "README.md" }),
        ]),
      getPullRequestReviewComments: (_id) => Promise.resolve([]),
    });

    // When
    const filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
    const children = await filesRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 2);

    const readme = children[0]!;
    const readmeTreeItem = readme.getTreeItem();
    assert.strictEqual(readmeTreeItem.label, "README.md");
    assert.ok(readme instanceof FileTreeNode);

    const src = children[1] as FolderTreeNode;
    const srcTreeItem = src.getTreeItem();
    assert.strictEqual(srcTreeItem.label, "src");
    assert.ok(src instanceof FolderTreeNode);
    assert.strictEqual(src.children.length, 2);

    const components = src.children[0] as FolderTreeNode;
    const componentsTreeItem = components.getTreeItem();
    assert.strictEqual(componentsTreeItem.label, "components");
    assert.ok(components instanceof FolderTreeNode);
    assert.strictEqual(components.children.length, 2);

    const button = components.children[0]!;
    const buttonTreeItem = button.getTreeItem();
    assert.strictEqual(buttonTreeItem.label, "Button.tsx");
    assert.ok(button instanceof FileTreeNode);

    const modal = components.children[1]!;
    const modalTreeItem = modal.getTreeItem();
    assert.strictEqual(modalTreeItem.label, "Modal.tsx");
    assert.ok(modal instanceof FileTreeNode);

    const utils = src.children[1] as FolderTreeNode;
    const utilsTreeItem = utils.getTreeItem();
    assert.strictEqual(utilsTreeItem.label, "utils");
    assert.ok(utils instanceof FolderTreeNode);
    assert.strictEqual(utils.children.length, 1);

    const helpers = utils.children[0]!;
    const helpersTreeItem = helpers.getTreeItem();
    assert.strictEqual(helpersTreeItem.label, "helpers.ts");
    assert.ok(helpers instanceof FileTreeNode);
  });

  test("Returns a single file with multiple review comments", async () => {
    // Given
    const repository = createRepositoryStub({
      getPullRequestFiles: (_id) => Promise.resolve([createFileStub({ filename: "README.md" })]),
      getPullRequestReviewComments: (_id) =>
        Promise.resolve([
          createPullRequestCommentStub({ body: "Comment 1", path: "README.md" }),
          createPullRequestCommentStub({ body: "Comment 2", path: "README.md" }),
          createPullRequestCommentStub({ body: "Comment 3", path: "not-readme.md" }),
        ]),
    });

    // When
    const filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
    const children = await filesRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 1);
    const readme = children[0]!;
    const readmeTreeItem = readme.getTreeItem();
    assert.strictEqual(readmeTreeItem.label, "README.md");
    assert.ok(readme instanceof FileTreeNode);

    const reviewComments = readme.getChildren();
    assert.strictEqual(reviewComments.length, 2);
    assert.ok(reviewComments[0] instanceof ReviewCommentTreeNode);
    assert.ok(reviewComments[1] instanceof ReviewCommentTreeNode);
  });

  test("getTreeItem should return TreeItem with correct properties", () => {
    // Given
    const repository = createRepositoryStub({
      getPullRequestFiles: (_id) => Promise.resolve([]),
    });
    const filesRootTreeNode = new FilesRootTreeNode(repository, pullId);

    // When
    const treeItem = filesRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "Files");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(treeItem.contextValue, "file");
    assert.deepStrictEqual(treeItem.iconPath, new vscode.ThemeIcon("file-directory"));
    assert.strictEqual(treeItem.tooltip, "Files");
  });

  test("getTreeItem should respect custom collapsibleState", () => {
    // Given
    const repository = createRepositoryStub({
      getPullRequestFiles: (_id) => Promise.resolve([]),
    });
    const filesRootTreeNode = new FilesRootTreeNode(repository, pullId);
    filesRootTreeNode.collapsibleState = "expanded";

    // When
    const treeItem = filesRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
  });
});
