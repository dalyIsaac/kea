import * as assert from "assert";
import * as vscode from "vscode";
import { IKeaContext } from "../../../core/context";
import { IRepository } from "../../../repository/repository";
import { PullRequestId } from "../../../types/kea";
import { CommitsRootTreeNode } from "./commits-root-tree-node";

suite("CommitsRootTreeNode", () => {
  // Mock repository and pull request ID for tests
  const mockRepository = {
    getPullRequestCommits: async () => Promise.resolve([]),
  } as unknown as IRepository;
  const mockPullId = { owner: "test", repo: "test", number: 123 } as PullRequestId;
  const mockContext = {
    gitManager: {
      getLocalGitRepository: () => Promise.resolve(new Error("No local repo")),
    },
    pullRequestContents: {
      treeViewProvider: {
        refresh: () => {
          // Mock refresh function
        },
      },
    },
  } as unknown as IKeaContext;

  test("should initialize with correct default collapsible state", () => {
    // Given/When
    const commitsRootTreeNode = new CommitsRootTreeNode(mockRepository, mockPullId, mockContext);

    // Then
    assert.strictEqual(commitsRootTreeNode.collapsibleState, "collapsed");
  });

  test("getTreeItem should return TreeItem with correct properties", () => {
    // Given
    const commitsRootTreeNode = new CommitsRootTreeNode(mockRepository, mockPullId, mockContext);

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
    const commitsRootTreeNode = new CommitsRootTreeNode(mockRepository, mockPullId, mockContext);
    commitsRootTreeNode.collapsibleState = "expanded";

    // When
    const treeItem = commitsRootTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
  });

  test("getChildren should return empty array when repository returns empty commits", async () => {
    // Given
    const commitsRootTreeNode = new CommitsRootTreeNode(mockRepository, mockPullId, mockContext);

    // When
    const children = await commitsRootTreeNode.getChildren();

    // Then
    assert.deepStrictEqual(children, []);
  });

  test("getChildren should return CommitTreeNodes when repository returns commits", async () => {
    // Given
    const mockCommit = { sha: "abc123", commit: { message: "Test commit" } };
    const repoWithCommits = {
      getPullRequestCommits: async () => Promise.resolve([mockCommit]),
    } as unknown as IRepository;
    const commitsRootTreeNode = new CommitsRootTreeNode(repoWithCommits, mockPullId, mockContext);

    // When
    const children = await commitsRootTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 1);
    // We're not testing CommitTreeNode implementation details here,
    // just that we get the right number of children
  });

  test("getChildren should handle repository errors", async () => {
    // Given
    const errorRepo = {
      getPullRequestCommits: async () => Promise.resolve(new Error("Test error")),
    } as unknown as IRepository;
    const commitsRootTreeNode = new CommitsRootTreeNode(errorRepo, mockPullId, mockContext);

    // When
    const children = await commitsRootTreeNode.getChildren();

    // Then
    assert.deepStrictEqual(children, []);
  });
});
