import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { formatDate } from "../core/utils";
import {
  createAccountStub,
  createKeaContextStub,
  createPullRequestStub,
  createRepositoryStub,
  createWorkspaceFolderStub,
} from "../test-utils";
import { PullRequest } from "../types/kea";
import { createPullRequestListQuickPick } from "./pull-request-list-picks";

suite("pull-request-list-picks", () => {
  let sandbox: sinon.SinonSandbox;
  let contextStub: ReturnType<typeof createKeaContextStub>;
  let repositoryStub1: ReturnType<typeof createRepositoryStub>;
  let repositoryStub2: ReturnType<typeof createRepositoryStub>;
  let workspaceFolder1: vscode.WorkspaceFolder;
  let workspaceFolder2: vscode.WorkspaceFolder;
  let pullRequest1: PullRequest;
  let pullRequest2: PullRequest;
  let pullRequest3: PullRequest;

  setup(() => {
    sandbox = sinon.createSandbox();

    // Create stubs
    contextStub = createKeaContextStub();

    workspaceFolder1 = createWorkspaceFolderStub({
      uri: vscode.Uri.parse("file:///workspace1"),
      name: "workspace1",
      index: 0,
    });

    workspaceFolder2 = createWorkspaceFolderStub({
      uri: vscode.Uri.parse("file:///workspace2"),
      name: "workspace2",
      index: 1,
    });

    repositoryStub1 = createRepositoryStub();
    // Create a second repository with a different account
    repositoryStub2 = createRepositoryStub({
      account: createAccountStub({
        accountKey: {
          providerId: "providerId2",
          accountId: "accountId2",
        },
      }),
    });

    // Create test pull requests with different timestamps
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    pullRequest1 = createPullRequestStub({
      number: 123,
      title: "Feature PR 1",
      url: "https://github.com/owner1/repo1/pull/123",
      repository: {
        name: "repo1",
        owner: "owner1",
        url: "https://github.com/owner1/repo1",
      },
      updatedAt: yesterday, // Second most recent
    });

    pullRequest2 = createPullRequestStub({
      number: 456,
      title: "Bug Fix PR 2",
      url: "https://github.com/owner2/repo2/pull/456",
      repository: {
        name: "repo2",
        owner: "owner2",
        url: "https://github.com/owner2/repo2",
      },
      updatedAt: twoDaysAgo, // Oldest
    });

    pullRequest3 = createPullRequestStub({
      number: 789,
      title: "Hotfix PR 3",
      url: "https://github.com/owner3/repo3/pull/789",
      repository: {
        name: "repo3",
        owner: "owner3",
        url: "https://github.com/owner3/repo3",
      },
      updatedAt: today, // Most recent
    });
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should return pull request list picks sorted by updatedAt", async () => {
    // Given - deliberate unsorted order in the repository responses
    (contextStub.gitManager.getAllRepositoriesAndInfo as sinon.SinonStub).resolves([
      {
        repository: repositoryStub1,
        workspaceFolder: workspaceFolder1,
        account: repositoryStub1.account,
      },
      {
        repository: repositoryStub2,
        workspaceFolder: workspaceFolder2,
        account: repositoryStub2.account,
      },
    ]);

    // First repo returns PRs in reverse chronological order
    (repositoryStub1.getPullRequestList as sinon.SinonStub).resolves([pullRequest2, pullRequest1]);
    // Second repo returns the most recent PR
    (repositoryStub2.getPullRequestList as sinon.SinonStub).resolves([pullRequest3]);

    // When
    const result = await createPullRequestListQuickPick(contextStub);

    // Then
    assert.strictEqual(result.length, 3);

    // Verify sorting by date (most recent first)
    // PR3 (today) -> PR1 (yesterday) -> PR2 (two days ago)
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, pullRequest3.title);
    assert.strictEqual(firstItem.description, pullRequest3.url);
    assert.strictEqual(firstItem.detail, `Last modified: ${formatDate(pullRequest3.updatedAt)}`);
    assert.strictEqual(firstItem.pullRequestId.number, pullRequest3.number);

    const secondItem = result[1]!;
    assert.strictEqual(secondItem.label, pullRequest1.title);
    assert.strictEqual(secondItem.description, pullRequest1.url);
    assert.strictEqual(secondItem.detail, `Last modified: ${formatDate(pullRequest1.updatedAt)}`);
    assert.strictEqual(secondItem.pullRequestId.number, pullRequest1.number);

    const thirdItem = result[2]!;
    assert.strictEqual(thirdItem.label, pullRequest2.title);
    assert.strictEqual(thirdItem.description, pullRequest2.url);
    assert.strictEqual(thirdItem.detail, `Last modified: ${formatDate(pullRequest2.updatedAt)}`);
    assert.strictEqual(thirdItem.pullRequestId.number, pullRequest2.number);
  });

  test("should handle errors from repositories", async () => {
    // Given
    const error = new Error("Failed to get pull requests");
    // Prefix with underscore to indicate intentionally unused
    const _loggerErrorStub = sandbox.stub(console, "error");

    (contextStub.gitManager.getAllRepositoriesAndInfo as sinon.SinonStub).resolves([
      {
        repository: repositoryStub1,
        workspaceFolder: workspaceFolder1,
        account: repositoryStub1.account,
      },
      error,
    ]);

    (repositoryStub1.getPullRequestList as sinon.SinonStub).resolves([pullRequest1]);

    // When
    const result = await createPullRequestListQuickPick(contextStub);

    // Then
    assert.strictEqual(result.length, 1);
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, pullRequest1.title);
    assert.deepStrictEqual(firstItem.pullRequestId.number, pullRequest1.number);
  });

  test("should handle errors fetching pull requests", async () => {
    // Given
    const error = new Error("Failed to fetch pull requests");

    (contextStub.gitManager.getAllRepositoriesAndInfo as sinon.SinonStub).resolves([
      {
        repository: repositoryStub1,
        workspaceFolder: workspaceFolder1,
        account: repositoryStub1.account,
      },
      {
        repository: repositoryStub2,
        workspaceFolder: workspaceFolder2,
        account: repositoryStub2.account,
      },
    ]);

    (repositoryStub1.getPullRequestList as sinon.SinonStub).resolves([pullRequest1]);
    (repositoryStub2.getPullRequestList as sinon.SinonStub).resolves(error);

    // When
    const result = await createPullRequestListQuickPick(contextStub);

    // Then
    assert.strictEqual(result.length, 1);
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, pullRequest1.title);
    assert.deepStrictEqual(firstItem.pullRequestId.number, pullRequest1.number);
  });

  test("should return empty array when no pull requests are found", async () => {
    // Given
    (contextStub.gitManager.getAllRepositoriesAndInfo as sinon.SinonStub).resolves([]);

    // When
    const result = await createPullRequestListQuickPick(contextStub);

    // Then
    assert.strictEqual(result.length, 0);
  });
});
