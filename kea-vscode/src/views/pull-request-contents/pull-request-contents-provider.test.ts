import * as assert from "assert";
import * as vscode from "vscode";
import { IKeaRepository } from "../../repository/kea-repository";
import { RepositoryManager } from "../../repository/repository-manager";
import {
  assertArrayContentsEqual,
  createCacheStub,
  createPullRequestStub,
  createRepositoryStub,
  createWorkspaceFolderStub,
} from "../../test-utils";
import { PullRequestId, RepoId } from "../../types/kea";
import { PullRequestListNode } from "../pull-request-list/pull-request-list-node";
import { CollapsibleState, ITreeNode } from "../tree-node";
import { CommentsRootTreeNode } from "./comments/comments-root-tree-node";
import { CommitsRootTreeNode } from "./commits/commits-root-tree-node";
import { FilesRootTreeNode } from "./files/files-root-tree-node";
import { PullRequestContentsProvider, PullRequestTreeNode } from "./pull-request-contents-provider";

const createGetChildrenStubs = async (getPullRequest?: IKeaRepository["getPullRequest"]) => {
  const repoId: RepoId = { owner: "owner", repo: "repo" };
  const pullId: PullRequestId = { ...repoId, number: 1 };

  const pullRequest = createPullRequestStub({ number: pullId.number });
  const repository = createRepositoryStub({
    repoId,
    getPullRequest:
      getPullRequest ??
      ((id) => (id.number === pullId.number ? Promise.resolve(pullRequest) : Promise.resolve(new Error("Pull request not found")))),
  });

  const repositoryManager = new RepositoryManager();
  repositoryManager.addRepository(repository);

  const cache = createCacheStub();

  const provider = new PullRequestContentsProvider(repositoryManager, cache);
  await provider.openPullRequest(repository.account.accountKey, pullId);

  return {
    repoId,
    repository,
    repositoryManager,
    provider,
    pullId,
    cache,
  };
};

suite("PullRequestContentsProvider", () => {
  test("getChildren returns an empty array when the pull request is not open", async () => {
    // Given
    const repositoryManager = new RepositoryManager();
    const provider = new PullRequestContentsProvider(repositoryManager, createCacheStub());

    // When
    const children = await provider.getChildren();

    // Then
    assert.deepStrictEqual(children, []);
  });

  test("getChildren returns the root children when the pull request is open", async () => {
    // Given
    const { provider } = await createGetChildrenStubs();

    // When
    const result = await provider.getChildren();

    // Then
    assert.strictEqual(result.length, 3);
    assert.ok(result[0] instanceof CommitsRootTreeNode);
    assert.ok(result[1] instanceof CommentsRootTreeNode);
    assert.ok(result[2] instanceof FilesRootTreeNode);
  });

  class SuccessTestTreeNode extends PullRequestListNode {
    label: string;
    override collapsibleState: CollapsibleState;

    constructor(label: string, collapsibleState: CollapsibleState) {
      super({ accountId: "", providerId: "" }, createPullRequestStub(), createWorkspaceFolderStub());
      this.label = label;
      this.collapsibleState = collapsibleState;
    }

    getChildren = (): SuccessTestTreeNode[] => {
      return [new SuccessTestTreeNode("Child 1", "none")];
    };
  }

  test("getChildren returns the children of the given element", async () => {
    // Given
    const { provider } = await createGetChildrenStubs();

    const element = new SuccessTestTreeNode("Parent", "collapsed") as unknown as PullRequestTreeNode;

    // When
    const children = await provider.getChildren(element);

    // Then
    assert.strictEqual(children.length, 1);
    assert.ok(children[0] instanceof SuccessTestTreeNode);
    assert.strictEqual(children[0].label, "Child 1");
  });

  test("getChildren fails for a non-parent tree item", async () => {
    // Given
    const { provider } = await createGetChildrenStubs();

    class NonParentTreeNode implements ITreeNode {
      getTreeItem = (): vscode.TreeItem => new vscode.TreeItem("Non-parent", vscode.TreeItemCollapsibleState.None);
    }

    const element = new NonParentTreeNode() as unknown as PullRequestTreeNode;

    // When
    const result = provider.getChildren(element);

    // Then
    assert.deepStrictEqual(result, []);
  });

  test("refresh calls onDidChangeTreeData and clears cache", async () => {
    // Given
    const { provider, repository, cache } = await createGetChildrenStubs();

    let eventFired = false;
    provider.onDidChangeTreeData(() => {
      eventFired = true;
    });

    // When
    provider.refresh();

    // Then
    assert.strictEqual(eventFired, true);
    assert.strictEqual((cache.invalidate as sinon.SinonStub).calledOnce, true);

    const { owner, repo } = repository.repoId;
    assert.strictEqual((cache.invalidate as sinon.SinonStub).calledWith(owner, repo), true);
  });

  test("openPullRequest updates the pull request info", async () => {
    // Given
    const { provider, repository, pullId } = await createGetChildrenStubs();

    // When
    const result = await provider.openPullRequest(repository.account.accountKey, pullId);
    const firstChildren = await provider.getChildren();
    const secondChildren = await provider.getChildren();

    // Then
    assert.strictEqual(result, true);
    assertArrayContentsEqual(firstChildren, secondChildren);
  });

  test("openPullRequest will change the returned children", async () => {
    // Given
    const getPullRequest = (id: PullRequestId) => {
      if (id.number === 1) {
        return Promise.resolve(createPullRequestStub({ number: 1 }));
      } else if (id.number === 2) {
        return Promise.resolve(createPullRequestStub({ number: 2 }));
      }
      return Promise.resolve(new Error("Pull request not found"));
    };

    const { provider, repository, pullId } = await createGetChildrenStubs(getPullRequest);

    // When
    const result = await provider.openPullRequest(repository.account.accountKey, pullId);
    const firstChildren = await provider.getChildren();
    const result2 = await provider.openPullRequest(repository.account.accountKey, { ...pullId, number: 2 });
    const secondChildren = await provider.getChildren();

    // Then
    assert.strictEqual(result, true);
    assert.strictEqual(result2, true);
    assert.strictEqual(firstChildren.length, 3);
    assert.strictEqual(secondChildren.length, 3);

    for (let i = 0; i < firstChildren.length; i++) {
      assert.notEqual(firstChildren[i], secondChildren[i]);
    }
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
