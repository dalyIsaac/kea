import * as assert from "assert";
import { RepositoryManager } from "../../repository/repository-manager";
import { createAccountManagerStub, createCacheStub, createPullRequestStub, createRepositoryStub } from "../../test-utils";
import { PullRequestListTreeProvider } from "./pull-request-list-tree-provider";
import { PullRequestTreeItem } from "./pull-request-tree-item";

suite("PullRequestListTreeProvider", () => {
  test("getTreeItem returns the correct tree item", () => {
    // Given
    const accountManager = createAccountManagerStub();
    const repositoryManager = new RepositoryManager();
    const repository = createRepositoryStub();
    const pullRequest = createPullRequestStub();
    const cache = createCacheStub();

    const provider = new PullRequestListTreeProvider(accountManager, repositoryManager, cache);
    const item = new PullRequestTreeItem(repository.account.accountKey, pullRequest);

    // When
    const treeItem = provider.getTreeItem(item);

    // Then
    assert.strictEqual(treeItem, item);
  });
});
