import * as assert from "assert";
import { RepositoryManager } from "../../repository/repository-manager";
import { createPullRequestStub, createRepositoryStub } from "../../test-utils";
import { PullRequestId, RepoId } from "../../types/kea";
import { PullRequestListNode } from "../pull-request-list/pull-request-list-node";
import { CollapsibleState } from "../tree-node";
import { CommentsRootTreeNode } from "./comments-root-tree-node";
import { CommitsRootTreeNode } from "./commits-root-tree-node";
import { FilesRootTreeNode } from "./files-root-tree-node";
import { PullRequestTreeNode, PullRequestTreeProvider } from "./pull-request-tree-provider";

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
  test("getChildren returns an empty array when the pull request is not open", async () => {
    // Given
    const repositoryManager = new RepositoryManager();
    const provider = new PullRequestTreeProvider(repositoryManager);

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
    assert.strictEqual(result.length, 2);
    assert.ok(result[0] instanceof CommentsRootTreeNode);
    assert.ok(result[1] instanceof FilesRootTreeNode);
  });

  class SuccessTestTreeNode extends PullRequestListNode {
    label: string;
    override collapsibleState: CollapsibleState;

    constructor(label: string, collapsibleState: CollapsibleState) {
      super({ accountId: "", providerId: "" }, createPullRequestStub());
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

    const element = new CommitsRootTreeNode() as unknown as PullRequestTreeNode;

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
