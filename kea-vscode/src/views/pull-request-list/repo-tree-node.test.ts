import * as assert from "assert";
import * as vscode from "vscode";
import { IAccount, IAccountKey } from "../../account/account";
import { createKeaContextStub, createPullRequestStub, createRemoteRepositoryStub, createWorkspaceFolderStub } from "../../test-utils";
import { PullRequestListNode } from "./pull-request-list-node";
import { RepoTreeNode } from "./repo-tree-node";

suite("RepoTreeNode", () => {
  const ctx = createKeaContextStub();
  const accountKey: IAccountKey = { providerId: "github", accountId: "test-account" };
  const workspaceFolder = createWorkspaceFolderStub({
    uri: vscode.Uri.file("c:/test/workspace"),
    name: "test-workspace",
  });

  test("should be created with the correct properties", () => {
    // Given
    const mockRepository = createRemoteRepositoryStub({
      remoteUrl: "https://github.com/owner/repo",
      account: { accountKey } as IAccount,
    });

    // When
    const repoTreeNode = new RepoTreeNode(ctx, mockRepository, workspaceFolder);

    // Then
    assert.strictEqual(repoTreeNode.collapsibleState, "collapsed");
  });

  test("getTreeItem returns a TreeItem with the correct properties", () => {
    // Given
    const mockRepository = createRemoteRepositoryStub({
      remoteUrl: "https://github.com/owner/repo",
      account: { accountKey } as IAccount,
    });
    const mockWorkspaceFolder = createWorkspaceFolderStub({
      uri: vscode.Uri.file("c:/test/workspace"),
      name: "test-workspace",
    });
    const repoTreeNode = new RepoTreeNode(ctx, mockRepository, mockWorkspaceFolder);

    // When
    const treeItem = repoTreeNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "test-workspace");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
    assert.strictEqual(treeItem.contextValue, "repository");
    assert.strictEqual(treeItem.description, "https://github.com/owner/repo");
  });

  test("getChildren returns PullRequestListNodes on success", async () => {
    // Given
    const pullRequest1 = createPullRequestStub({ number: 1, title: "PR 1" });
    const pullRequest2 = createPullRequestStub({ number: 2, title: "PR 2" });
    const mockRepository = createRemoteRepositoryStub({
      remoteUrl: "https://github.com/owner/repo",
      account: { accountKey } as IAccount,
      getPullRequestList: () => Promise.resolve([pullRequest1, pullRequest2]),
    });
    const mockWorkspaceFolder = createWorkspaceFolderStub({
      uri: vscode.Uri.file("c:/test/workspace"),
      name: "test-workspace",
    });
    const repoTreeNode = new RepoTreeNode(ctx, mockRepository, mockWorkspaceFolder);

    // When
    const children = await repoTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 2);
    assert.ok(children[0] instanceof PullRequestListNode);
    assert.strictEqual(children[0].pullRequest, pullRequest1);
    assert.strictEqual(children[0].accountKey, accountKey);
    assert.ok(children[1] instanceof PullRequestListNode);
    assert.strictEqual(children[1].pullRequest, pullRequest2);
    assert.strictEqual(children[1].accountKey, accountKey);
  });

  test("getChildren returns empty array on failure", async () => {
    // Given
    const error = new Error("Failed to fetch PRs");
    const mockRepository = createRemoteRepositoryStub({
      remoteUrl: "https://github.com/owner/repo",
      account: { accountKey } as IAccount,
      getPullRequestList: () => Promise.resolve(error),
    });
    const mockWorkspaceFolder = createWorkspaceFolderStub({
      uri: vscode.Uri.file("c:/test/workspace"),
      name: "test-workspace",
    });
    const repoTreeNode = new RepoTreeNode(ctx, mockRepository, mockWorkspaceFolder);

    // When
    const children = await repoTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });
});
