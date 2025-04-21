import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import {
  createGitManagerStub,
  createKeaContextStub,
  createPullRequestStub,
  createUserStub,
  createWorkspaceFolderStub,
} from "../../test-utils";
import { Branch, RefType } from "../../types/git";
import { PullRequestId } from "../../types/kea";
import { PullRequestListNode } from "./pull-request-list-node";

suite("PullRequestListNode", () => {
  const accountKey: IAccountKey = {
    providerId: "github",
    accountId: "accountId",
  };

  // Use the gitManager stub in the context
  const ctx = createKeaContextStub({
    gitManager: createGitManagerStub({
      getGitBranchForRepository: sinon.stub().resolves({
        name: "feature-branch",
        type: RefType.Head,
      } as Branch),
    }),
  });

  test("should be created with the correct properties", () => {
    // Given
    const pullRequest = createPullRequestStub();

    // When
    const pullRequestListNode = new PullRequestListNode(ctx, accountKey, pullRequest, createWorkspaceFolderStub());

    // Then
    assert.strictEqual(pullRequestListNode.accountKey, accountKey);
    assert.strictEqual(pullRequestListNode.pullRequest, pullRequest);
    assert.strictEqual(pullRequestListNode.collapsibleState, "none");
  });

  test("getTreeItem returns a TreeItem with correct basic properties and command", async () => {
    // Given
    const pullRequest = createPullRequestStub({
      title: "Test PR",
      number: 123,
      repository: {
        owner: "owner",
        name: "repo",
        url: "https://github.com/owner/repo",
      },
      base: {
        ref: "main",
        sha: "basesha",
        owner: "owner",
        repo: "repo",
      },
    });
    const pullRequestListNode = new PullRequestListNode(ctx, accountKey, pullRequest, createWorkspaceFolderStub());

    // When
    const treeItem = await pullRequestListNode.getTreeItem();

    // Then
    assert.strictEqual(treeItem.label, "Test PR");
    assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
    assert.strictEqual(treeItem.contextValue, "pullRequest"); // Default context value
    assert.ok(treeItem.command, "TreeItem should have a command");
    assert.strictEqual(treeItem.command.command, "kea.openPullRequest");
    assert.strictEqual(treeItem.command.title, "Open Pull Request");

    // Verify the command arguments
    const args = treeItem.command.arguments;
    assert.ok(Array.isArray(args));
    assert.strictEqual(args.length, 1);
    const [argArray] = args as [[IAccountKey, PullRequestId]];
    assert.strictEqual(argArray[0], accountKey);
    const pullId = argArray[1];
    assert.strictEqual(pullId.owner, "owner");
    assert.strictEqual(pullId.repo, "repo");
    assert.strictEqual(pullId.number, 123);
  });

  test("getTreeItem formats description correctly, trimming long branch names", async () => {
    // Given
    const longBranchName = "very-long-branch-name-that-exceeds-the-limit";
    const pullRequest = createPullRequestStub({
      title: "Test PR with long branch",
      number: 456,
      head: {
        ref: longBranchName,
        sha: "abc123",
        owner: "owner",
        repo: "repo",
      },
      base: {
        ref: "main",
        sha: "basesha",
        owner: "owner",
        repo: "repo",
      },
      user: createUserStub({ login: "testUser" }), // Explicitly set the user with the expected login
    });
    const pullRequestListNode = new PullRequestListNode(ctx, accountKey, pullRequest, createWorkspaceFolderStub());

    // When
    const treeItem = await pullRequestListNode.getTreeItem();

    // Then
    assert.ok(treeItem.description);
    assert.strictEqual(
      treeItem.description,
      "#456 by testUser (very-long-branch...)",
      "Description should contain the PR number, user login, and trimmed branch name",
    );
  });

  test("getTreeItem indicates when the PR branch is checked out", async () => {
    // Given
    const branchName = "feature-branch";

    // Configure the gitManager to return the same branch name as the PR head ref
    (ctx.gitManager.getGitBranchForRepository as sinon.SinonStub).withArgs(sinon.match.any).resolves({
      name: branchName,
      type: RefType.Head,
    } as Branch);

    const pullRequest = createPullRequestStub({
      title: "Checked Out PR",
      number: 789,
      head: {
        ref: branchName, // Same as the branch the gitManager will return
        sha: "abc123",
        owner: "owner",
        repo: "repo",
      },
      base: {
        ref: "main",
        sha: "basesha",
        owner: "owner",
        repo: "repo",
      },
    });

    const pullRequestListNode = new PullRequestListNode(ctx, accountKey, pullRequest, createWorkspaceFolderStub());

    // When
    const treeItem = await pullRequestListNode.getTreeItem();

    // Then
    assert.ok(treeItem.iconPath instanceof vscode.ThemeIcon);
    assert.strictEqual(treeItem.iconPath.id, "git-branch");
    assert.strictEqual(treeItem.contextValue, "pullRequest:checkedout");
    assert.ok((treeItem.tooltip as string).includes("(Checked out)"));
  });
});
