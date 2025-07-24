import * as assert from "assert";
import sinon from "sinon";
import { IRepository } from "../../repository/repository";
import { createKeaContextStub, createRepositoryManagerStub, createRepositoryStub, stubEvents, subscribeToEvent } from "../../test-utils";
import { PullRequestListTreeProvider } from "./pull-request-list-tree-provider";
import { RepoTreeNode } from "./repo-tree-node";

const createStubs = (
  stubs: {
    allRepos?: IRepository[];
  } = {},
) => {
  const { stub: repositoryManager, eventFirers } = stubEvents(
    createRepositoryManagerStub({
      getAllRepositories: sinon.stub().returns(stubs.allRepos ?? []),
    }),
    ["onRepositoryStateChanged"],
  );

  const ctx = createKeaContextStub({ repositoryManager });

  return {
    ctx,
    repositoryManager,
    eventFirers,
  };
};

suite("PullRequestListTreeProvider", () => {
  test("should fire tree data change event when repository state changes", () => {
    // Given
    const { ctx, eventFirers } = createStubs();
    const treeProvider = new PullRequestListTreeProvider(ctx);
    const calls = subscribeToEvent(treeProvider.onDidChangeTreeData);

    // When
    eventFirers.onRepositoryStateChanged({});

    // Then
    assert.strictEqual(calls.length, 1);
  });

  test("should get root children from repositories", async () => {
    // Given
    const repo1 = createRepositoryStub();
    const { ctx } = createStubs({
      allRepos: [repo1],
    });

    const treeProvider = new PullRequestListTreeProvider(ctx);

    // When
    const children = await treeProvider.getChildren();

    // Then
    assert.strictEqual(children.length, 1);
    assert.ok(children[0] instanceof RepoTreeNode);
  });

  test("should clear cache when invalidating", () => {
    // Given
    const { ctx } = createStubs();
    const treeProvider = new PullRequestListTreeProvider(ctx);

    // When
    treeProvider.refresh(true);

    // Then
    assert.ok((ctx.apiCache.clear as sinon.SinonStub).calledOnce);
  });

  test("should clear not cache when just refreshing", () => {
    // Given
    const { ctx } = createStubs();
    const treeProvider = new PullRequestListTreeProvider(ctx);

    // When
    treeProvider.refresh();

    // Then
    assert.ok((ctx.apiCache.clear as sinon.SinonStub).notCalled);
  });
});
