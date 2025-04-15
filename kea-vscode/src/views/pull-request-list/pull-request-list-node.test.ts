import * as assert from "assert";
import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { createPullRequestStub } from "../../test-utils";
import { PullRequestId } from "../../types/kea";
import { PullRequestListNode } from "./pull-request-list-node";

suite("PullRequestListNode", () => {
  const accountKey: IAccountKey = {
    providerId: "github",
    accountId: "accountId",
  };

  test("should be created with the correct properties", () => {
    // Given
    const pullRequest = createPullRequestStub({
      title: "Test PR",
      number: 123,
      repository: {
        owner: "owner",
        name: "repo",
        url: "https://github.com/owner/repo",
      },
    });

    // When
    const pullRequestListNode = new PullRequestListNode(accountKey, pullRequest);

    // Then
    assert.strictEqual(pullRequestListNode.accountKey, accountKey);
    assert.strictEqual(pullRequestListNode.pullRequest, pullRequest);
    assert.strictEqual(pullRequestListNode.collapsibleState, "none");
  });

  test("getTreeItem returns a TreeItem with the correct properties", () => {
    // Given
    const pullRequest = createPullRequestStub({
      title: "Test PR",
      number: 123,
      repository: {
        owner: "owner",
        name: "repo",
        url: "https://github.com/owner/repo",
      },
    });
    const pullRequestListNode = new PullRequestListNode(accountKey, pullRequest);

    // When
    const treeItem = pullRequestListNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "Test PR");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
    assert.strictEqual(treeItem.contextValue, "pullRequest");
  });

  test("getTreeItem returns a TreeItem with the correct command", () => {
    // Given
    const pullRequest = createPullRequestStub({
      title: "Test PR",
      number: 123,
      repository: {
        owner: "owner",
        name: "repo",
        url: "https://github.com/owner/repo",
      },
    });
    const pullRequestListNode = new PullRequestListNode(accountKey, pullRequest);

    // When
    const treeItem = pullRequestListNode.getTreeItem();

    // Then
    assert.ok(treeItem.command);
    assert.strictEqual(treeItem.command.command, "kea.openPullRequest");
    assert.strictEqual(treeItem.command.title, "Open Pull Request");

    // Verify the command arguments
    const args = treeItem.command.arguments;
    assert.ok(Array.isArray(args));
    assert.strictEqual(args.length, 1);

    const [argArray] = args as [[IAccountKey, PullRequestId]];

    // Check account key
    assert.strictEqual(argArray[0], accountKey);

    // Check pull request ID
    const pullId = argArray[1];
    assert.strictEqual(pullId.owner, "owner");
    assert.strictEqual(pullId.repo, "repo");
    assert.strictEqual(pullId.number, 123);
  });
});
