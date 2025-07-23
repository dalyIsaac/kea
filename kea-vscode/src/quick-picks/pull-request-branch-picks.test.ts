import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { formatDate } from "../core/utils";
import { createKeaContextStub, createPullRequestStub, createRemoteRepositoryStub, createWorkspaceFolderStub } from "../test-utils";
import { PullRequest } from "../types/kea";
import { createPullRequestBranchPicks } from "./pull-request-branch-picks";

suite("pull-request-branch-picks", () => {
  let sandbox: sinon.SinonSandbox;
  let contextStub: ReturnType<typeof createKeaContextStub>;
  let repositoryStub1: ReturnType<typeof createRemoteRepositoryStub>;
  let repositoryStub2: ReturnType<typeof createRemoteRepositoryStub>;
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

    repositoryStub1 = createRemoteRepositoryStub();
    repositoryStub2 = createRemoteRepositoryStub();

    // Create test pull requests with different timestamps
    const today = new Date();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    pullRequest1 = createPullRequestStub({
      head: {
        sha: "sha1",
        ref: "feature-branch-1",
        owner: "owner1",
        repo: "repo1",
      },
      title: "Pull Request 1",
      updatedAt: yesterday, // Second most recent
    });

    pullRequest2 = createPullRequestStub({
      head: {
        sha: "sha2",
        ref: "feature-branch-2",
        owner: "owner2",
        repo: "repo2",
      },
      title: "Pull Request 2",
      updatedAt: twoDaysAgo, // Oldest
    });

    pullRequest3 = createPullRequestStub({
      head: {
        sha: "sha3",
        ref: "feature-branch-3",
        owner: "owner3",
        repo: "repo3",
      },
      title: "Pull Request 3",
      updatedAt: today, // Most recent
    });
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should return pull request branch picks sorted by updatedAt", async () => {
    // Given - deliberate unsorted order in the repository responses
    (contextStub.gitManager.getAllRepositories as sinon.SinonStub).resolves([
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
    const result = await createPullRequestBranchPicks(contextStub);

    // Then
    assert.strictEqual(result.length, 3);

    // Verify sorting by date (most recent first)
    // PR3 (today) -> PR1 (yesterday) -> PR2 (two days ago)
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, pullRequest3.head.ref);
    assert.strictEqual(firstItem.detail, `Remote last modified: ${formatDate(pullRequest3.updatedAt)}`);

    const secondItem = result[1]!;
    assert.strictEqual(secondItem.label, pullRequest1.head.ref);
    assert.strictEqual(secondItem.detail, `Remote last modified: ${formatDate(pullRequest1.updatedAt)}`);

    const thirdItem = result[2]!;
    assert.strictEqual(thirdItem.label, pullRequest2.head.ref);
    assert.strictEqual(thirdItem.detail, `Remote last modified: ${formatDate(pullRequest2.updatedAt)}`);
  });

  test("should handle errors from repositories", async () => {
    // Given
    const error = new Error("Failed to get pull requests");
    // Stub Logger.error instead of console.error
    const _loggerErrorStub = sandbox.stub(console, "error");

    (contextStub.gitManager.getAllRepositories as sinon.SinonStub).resolves([
      {
        repository: repositoryStub1,
        workspaceFolder: workspaceFolder1,
        account: repositoryStub1.account,
      },
      error,
    ]);

    (repositoryStub1.getPullRequestList as sinon.SinonStub).resolves([pullRequest1]);

    // When
    const result = await createPullRequestBranchPicks(contextStub);

    // Then
    assert.strictEqual(result.length, 1);
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, pullRequest1.head.ref);
  });

  test("should handle errors fetching pull requests", async () => {
    // Given
    const error = new Error("Failed to fetch pull requests");

    (contextStub.gitManager.getAllRepositories as sinon.SinonStub).resolves([
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
    const result = await createPullRequestBranchPicks(contextStub);

    // Then
    assert.strictEqual(result.length, 1);
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, pullRequest1.head.ref);
  });

  test("should return empty array when no pull requests are found", async () => {
    // Given
    (contextStub.gitManager.getAllRepositories as sinon.SinonStub).resolves([]);

    // When
    const result = await createPullRequestBranchPicks(contextStub);

    // Then
    assert.strictEqual(result.length, 0);
  });
});
