import * as assert from "assert";
import { RepositoryManager } from "../../repository/repository-manager";
import { createAccountManagerStub, createPullRequestStub, createRepositoryStub } from "../../test-utils";
import { PullRequestListTreeProvider } from "./pull-request-list-tree-provider";
import { PullRequestTreeItem } from "./pull-request-tree-item";

suite("PullRequestListTreeProvider", () => {
  test("getTreeItem returns the correct tree item", () => {
    // Given
    const accountManager = createAccountManagerStub();
    const repositoryManager = new RepositoryManager();
    const repository = createRepositoryStub();
    const pullRequest = createPullRequestStub();

    const provider = new PullRequestListTreeProvider(accountManager, repositoryManager);
    const item = new PullRequestTreeItem(repository.authSessionAccountId, pullRequest);

    // When
    const treeItem = provider.getTreeItem(item);

    // Then
    assert.strictEqual(treeItem, item);
  });
});
