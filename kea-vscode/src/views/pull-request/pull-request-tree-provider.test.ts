import * as assert from "assert";
import * as vscode from "vscode";
import { RepositoryManager } from "../../repository/repository-manager";
import { createPullRequestStub, createRepositoryStub } from "../../test-utils";
import { PullRequestId, RepoId } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { CommentsRootTreeItem } from "./comments-root-tree-item";
import { CommitsRootTreeItem } from "./commits-root-tree-item";
import { FilesRootTreeItem } from "./files-root-tree-item";
import { PullRequestTreeItem, PullRequestTreeProvider } from "./pull-request-tree-provider";

const createGetChildrenStubs = async () => {
  const repoId: RepoId = { owner: "owner", repo: "repo" };
  const pullId: PullRequestId = { ...repoId, number: 1 };

  const pullRequest = createPullRequestStub({ number: pullId.number });
  const repository = createRepositoryStub({
    repoId,
    getPullRequest: (id) =>
      id.number === pullId.number ? Promise.resolve(pullRequest) : Promise.resolve(new Error("Pull request not found")),
  });

  const repositoryManager = new RepositoryManager();
  repositoryManager.addRepository(repository);

  const provider = new PullRequestTreeProvider(repositoryManager);
  await provider.openPullRequest(repository.account.accountKey, pullId);

  return {
    repoId,
    repository,
    repositoryManager,
    provider,
    pullId,
  };
};

suite("PullRequestTreeProvider", () => {
  test("getTreeItem returns the correct tree item", () => {
    // Given
    const repositoryManager = new RepositoryManager();
    const provider = new PullRequestTreeProvider(repositoryManager);
    const item = new CommitsRootTreeItem();

    // When
    const treeItem = provider.getTreeItem(item);

    // Then
    assert.strictEqual(treeItem, item);
  });

  test("getChildren returns an empty array when the pull request is not open", () => {
    // Given
    const repositoryManager = new RepositoryManager();
    const provider = new PullRequestTreeProvider(repositoryManager);

    // When
    const children = provider.getChildren();

    // Then
    assert.deepStrictEqual(children, []);
  });

  test("getChildren returns the root children when the pull request is open", async () => {
    // Given
    const { provider } = await createGetChildrenStubs();

    // When
    const result = provider.getChildren();

    // Then
    const children = result as PullRequestTreeItem[];
    assert.strictEqual(children.length, 3);
    assert.ok(children[0] instanceof CommentsRootTreeItem);
    assert.ok(children[1] instanceof FilesRootTreeItem);
    assert.ok(children[2] instanceof CommitsRootTreeItem);
  });

  class SuccessTestTreeItem extends ParentTreeItem<SuccessTestTreeItem> {
    override getChildren(): SuccessTestTreeItem[] | Promise<SuccessTestTreeItem[]> {
      return [new SuccessTestTreeItem("Child 1", vscode.TreeItemCollapsibleState.None)];
    }
  }

  test("getChildren returns the children of the given element", async () => {
    // Given
    const { provider } = await createGetChildrenStubs();

    const element = new SuccessTestTreeItem("Parent", vscode.TreeItemCollapsibleState.Collapsed) as PullRequestTreeItem;

    // When
    const result = provider.getChildren(element);

    // Then
    const children = result as PullRequestTreeItem[];
    assert.strictEqual(children.length, 1);
    assert.ok(children[0] instanceof SuccessTestTreeItem);
    assert.strictEqual(children[0].label, "Child 1");
  });

  test("getChildren fails for a non-parent tree item", async () => {
    // Given
    const { provider } = await createGetChildrenStubs();

    const element = new CommitsRootTreeItem() as PullRequestTreeItem;

    // When
    const result = provider.getChildren(element);

    // Then
    assert.deepStrictEqual(result, []);
  });

  test("refresh calls onDidChangeTreeData", () => {
    // Given
    const repositoryManager = new RepositoryManager();
    const provider = new PullRequestTreeProvider(repositoryManager);

    let eventFired = false;
    provider.onDidChangeTreeData(() => {
      eventFired = true;
    });

    // When
    provider.refresh();

    // Then
    assert.strictEqual(eventFired, true);
  });

  test("openPullRequest updates the pull request info", async () => {
    // Given
    const { provider, repository, pullId } = await createGetChildrenStubs();

    // When
    const result = await provider.openPullRequest(repository.account.accountKey, pullId);

    // Then
    assert.strictEqual(result, true);
  });

  test("openPullRequest fails when the repository is not found", async () => {
    // Given
    const { provider, pullId } = await createGetChildrenStubs();

    // When
    const result = await provider.openPullRequest({ providerId: "invalid-provider-id", accountId: "invalid-account-id" }, pullId);

    // Then
    assert.strictEqual(result, false);
  });

  test("openPullRequest fails when the pull request is not found", async () => {
    // Given
    const { provider, repository } = await createGetChildrenStubs();

    const invalidPullId: PullRequestId = { ...repository.repoId, number: 9999 };

    // When
    const result = await provider.openPullRequest(repository.account.accountKey, invalidPullId);

    // Then
    assert.strictEqual(result, false);
  });
});
