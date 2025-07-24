import * as assert from "assert";
import * as vscode from "vscode";
import { IAccount, IAccountKey } from "../../account/account";
import {
  createKeaContextStub,
  createLocalRepositoryStub,
  createPullRequestStub,
  createRemoteRepositoryStub,
  createRepositoryStub,
  createWorkspaceFolderStub,
} from "../../test-utils";
import { PullRequest } from "../../types/kea";
import { PullRequestListNode } from "./pull-request-list-node";
import { RepoTreeNode } from "./repo-tree-node";

const createStubs = (stubs: { pullRequestsList?: PullRequest[] | Error } = {}) => {
  const ctx = createKeaContextStub();

  const accountKey: IAccountKey = { providerId: "github", accountId: "test-account" };
  const workspaceFolder = createWorkspaceFolderStub({
    uri: vscode.Uri.file("c:/test/workspace"),
    name: "test-workspace",
  });
  const remoteRepository = createRemoteRepositoryStub({
    remoteUrl: "https://github.com/owner/repo",
    account: { accountKey } as IAccount,
    getPullRequestList: () => Promise.resolve(stubs.pullRequestsList ?? []),
  });

  const repository = createRepositoryStub({
    localRepository: createLocalRepositoryStub({
      workspaceFolder,
    }),
    remoteRepository,
  });

  return { ctx, repository };
};

suite("RepoTreeNode", () => {
  test("should be created with the correct properties", () => {
    // Given
    const { ctx, repository } = createStubs();

    // When
    const repoTreeNode = new RepoTreeNode(ctx, repository);

    // Then
    assert.strictEqual(repoTreeNode.collapsibleState, "collapsed");
  });

  test("getTreeItem returns a TreeItem with the correct properties", () => {
    // Given
    const { ctx, repository } = createStubs();
    const repoTreeNode = new RepoTreeNode(ctx, repository);

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
    const { ctx, repository } = createStubs({
      pullRequestsList: [pullRequest1, pullRequest2],
    });
    const repoTreeNode = new RepoTreeNode(ctx, repository);

    // When
    const children = await repoTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 2);
    assert.ok(children[0] instanceof PullRequestListNode);
    assert.strictEqual(children[0].pullRequestHead.ref, pullRequest1.head.ref);
    assert.ok(children[1] instanceof PullRequestListNode);
    assert.strictEqual(children[1].pullRequestHead.ref, pullRequest2.head.ref);
  });

  test("getChildren returns empty array on failure", async () => {
    // Given
    const error = new Error("Failed to fetch PRs");
    const { ctx, repository } = createStubs({
      pullRequestsList: error,
    });
    const repoTreeNode = new RepoTreeNode(ctx, repository);

    // When
    const children = await repoTreeNode.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });
});
