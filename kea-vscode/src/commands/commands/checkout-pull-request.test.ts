/* eslint-disable @typescript-eslint/unbound-method */
import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { formatDate } from "../../core/utils";
import { IRepository } from "../../repository/repository";
import {
  createKeaContextStub,
  createLocalRepositoryStub,
  createPullRequestGitRefStub,
  createPullRequestStub,
  createRemoteRepositoryStub,
  createRepositoryManagerStub,
  createRepositoryStub,
  createWorkspaceFolderStub,
} from "../../test-utils";
import { PullRequest } from "../../types/kea";
import { ICheckoutPullRequestCommandArgs, createCheckoutPullRequest, createCheckoutPullRequestQuickPicks } from "./checkout-pull-request";

const createPullRequests = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const oldestPullRequest = createPullRequestStub({
    updatedAt: twoDaysAgo,
    number: 456,
    title: "Bug Fix PR 2",
    url: "https://github.com/owner2/repo2/pull/456",
    head: createPullRequestGitRefStub({
      ref: "bugfix-branch",
    }),
    repository: {
      name: "repo2",
      owner: "owner2",
      url: "https://github.com/owner2/repo2",
    },
  });

  const middlePullRequest = createPullRequestStub({
    updatedAt: yesterday,
    number: 123,
    title: "Feature PR 1",
    url: "https://github.com/owner1/repo1/pull/123",
    head: createPullRequestGitRefStub({
      ref: "feature-branch",
    }),
    repository: {
      name: "repo1",
      owner: "owner1",
      url: "https://github.com/owner1/repo1",
    },
  });

  const mostRecentPullRequest = createPullRequestStub({
    number: 789,
    title: "Hotfix PR 3",
    url: "https://github.com/owner3/repo3/pull/789",
    head: createPullRequestGitRefStub({
      ref: "hotfix-branch",
    }),
    repository: {
      name: "repo3",
      owner: "owner3",
      url: "https://github.com/owner3/repo3",
    },
    updatedAt: today, // Most recent
  });

  return [oldestPullRequest, middlePullRequest, mostRecentPullRequest] as const;
};

const createRepositories = (repository1PullRequests: PullRequest[] | Error, repository2PullRequests: PullRequest[] | Error) => {
  const workspaceFolder1 = createWorkspaceFolderStub({
    name: "repo1",
    uri: vscode.Uri.file("/path/to/repo1"),
  });

  const workspaceFolder2 = createWorkspaceFolderStub({
    name: "repo2",
    uri: vscode.Uri.file("/path/to/repo2"),
  });

  const repository1 = createRepositoryStub({
    localRepository: createLocalRepositoryStub({
      workspaceFolder: workspaceFolder1,
      checkout: sinon.stub().resolves(),
    }),
    remoteRepository: createRemoteRepositoryStub({
      getPullRequestList: sinon.stub().resolves(repository1PullRequests),
    }),
  });

  const repository2 = createRepositoryStub({
    localRepository: createLocalRepositoryStub({
      workspaceFolder: workspaceFolder2,
      checkout: sinon.stub().resolves(),
    }),
    remoteRepository: createRemoteRepositoryStub({
      getPullRequestList: sinon.stub().resolves(repository2PullRequests),
    }),
  });

  return [repository1, repository2] as const;
};

const createCtx = (
  stubs: {
    getAllRepositories?: IRepository[];
    getRepository?: IRepository | Error;
  } = {},
) => {
  const repositoryManager = createRepositoryManagerStub({
    getAllRepositories: sinon.stub().returns(stubs.getAllRepositories ?? []),
    getRepository: sinon.stub().returns(stubs.getRepository ?? new Error("Repository not found")),
  });
  return createKeaContextStub({ repositoryManager });
};

const setupCommandStubs = () => {
  const workspaceFolder = createWorkspaceFolderStub({
    name: "test-repo",
    uri: vscode.Uri.file("/path/to/test-repo"),
  });

  const pullRequestHead = createPullRequestGitRefStub({
    ref: "feature-branch",
  });

  const localRepository = createLocalRepositoryStub({
    workspaceFolder,
    checkout: sinon.stub().resolves(),
  });

  const repository = createRepositoryStub({
    localRepository,
  });

  const ctx = createKeaContextStub({
    repositoryManager: createRepositoryManagerStub({
      getRepository: sinon.stub().returns(repository),
      getAllRepositories: sinon.stub().returns([repository]),
    }),
  });

  return {
    workspaceFolder,
    pullRequestHead,
    repository,
    localRepository,
    ctx,
  };
};

suite("createCheckoutPullRequest", () => {
  test("should checkout branch when args are provided", async () => {
    // Given
    const { workspaceFolder, pullRequestHead, localRepository, ctx } = setupCommandStubs();
    const args: ICheckoutPullRequestCommandArgs = { pullRequestHead, workspaceFolder };

    // When
    const command = createCheckoutPullRequest(ctx);
    await command(args);

    // Then
    sinon.assert.calledOnceWithExactly(ctx.repositoryManager.getRepository as sinon.SinonStub, workspaceFolder);
    sinon.assert.calledOnceWithExactly(localRepository.checkout as sinon.SinonStub, "feature-branch");
  });

  test("should show quick pick and checkout selected branch when args are not provided", async () => {
    // Given
    const { workspaceFolder, pullRequestHead, localRepository, ctx } = setupCommandStubs();
    const showQuickPickStub = sinon.stub(vscode.window, "showQuickPick");
    const quickPickItem = { pullRequestHead, workspaceFolder, label: "PR #1" };
    showQuickPickStub.resolves(quickPickItem);

    // When
    const command = createCheckoutPullRequest(ctx);
    await command();

    // Then
    sinon.assert.calledOnce(showQuickPickStub);
    sinon.assert.calledOnceWithExactly(ctx.repositoryManager.getRepository as sinon.SinonStub, workspaceFolder);
    sinon.assert.calledOnceWithExactly(localRepository.checkout as sinon.SinonStub, "feature-branch");

    showQuickPickStub.restore();
  });

  test("should do nothing if quick pick is cancelled", async () => {
    // Given
    const { ctx } = setupCommandStubs();
    const showQuickPickStub = sinon.stub(vscode.window, "showQuickPick");
    showQuickPickStub.resolves(undefined);

    // When
    const command = createCheckoutPullRequest(ctx);
    await command();

    // Then
    sinon.assert.calledOnce(showQuickPickStub);
    sinon.assert.notCalled(ctx.repositoryManager.getRepository as sinon.SinonStub);

    showQuickPickStub.restore();
  });

  test("should log error if git repository is not found", async () => {
    // Given
    const { workspaceFolder, pullRequestHead } = setupCommandStubs();
    const args: ICheckoutPullRequestCommandArgs = { pullRequestHead, workspaceFolder };
    const error = new Error("Git repo not found");
    const ctx = createCtx({ getRepository: error });

    // When
    const command = createCheckoutPullRequest(ctx);
    await command(args);

    // Then
    sinon.assert.calledOnceWithExactly(ctx.repositoryManager.getRepository as sinon.SinonStub, workspaceFolder);
  });

  test("should show error message if checkout fails", async () => {
    // Given
    const { workspaceFolder, pullRequestHead } = setupCommandStubs();
    const args: ICheckoutPullRequestCommandArgs = { pullRequestHead, workspaceFolder };
    const checkoutError = new Error("Checkout failed");

    const localRepository = createLocalRepositoryStub({
      workspaceFolder,
      checkout: sinon.stub().rejects(checkoutError),
    });

    const repository = createRepositoryStub({ localRepository });
    const ctx = createCtx({ getRepository: repository });

    const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");

    // When
    const command = createCheckoutPullRequest(ctx);
    await command(args);

    // Then
    sinon.assert.calledOnceWithExactly(ctx.repositoryManager.getRepository as sinon.SinonStub, workspaceFolder);
    sinon.assert.calledOnceWithExactly(localRepository.checkout as sinon.SinonStub, "feature-branch");
    sinon.assert.calledOnce(showErrorMessageStub);
    assert.strictEqual(showErrorMessageStub.getCall(0).args[0], "Failed to checkout branch feature-branch: Checkout failed");

    showErrorMessageStub.restore();
  });

  test("should show error message with unknown error if checkout fails with non-Error", async () => {
    // Given
    const { workspaceFolder, pullRequestHead } = setupCommandStubs();
    const args: ICheckoutPullRequestCommandArgs = { pullRequestHead, workspaceFolder };

    const localRepository = createLocalRepositoryStub({
      workspaceFolder,
      checkout: sinon.stub().callsFake(() => {
        // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/only-throw-error
        throw "something bad happened";
      }),
    });

    const repository = createRepositoryStub({ localRepository });
    const ctx = createCtx({ getRepository: repository });

    const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");

    // When
    const command = createCheckoutPullRequest(ctx);
    await command(args);

    // Then
    sinon.assert.calledOnceWithExactly(ctx.repositoryManager.getRepository as sinon.SinonStub, workspaceFolder);
    sinon.assert.calledOnce(localRepository.checkout as sinon.SinonStub);
    sinon.assert.calledOnce(showErrorMessageStub);
    assert.strictEqual(showErrorMessageStub.getCall(0).args[0], "Failed to checkout branch feature-branch: Unknown error");

    showErrorMessageStub.restore();
  });
});

suite("createCheckoutPullRequestQuickPicks", () => {
  test("should return pull request branch picks sorted by updatedAt", async () => {
    // Given - deliberate unsorted order in the repository responses
    const [oldestPullRequest, middlePullRequest, mostRecentPullRequest] = createPullRequests();
    // First repo returns PRs in reverse chronological order
    const [repository1, repository2] = createRepositories([middlePullRequest, oldestPullRequest], [mostRecentPullRequest]);
    const ctx = createCtx({ getAllRepositories: [repository1, repository2] });

    // When
    const result = await createCheckoutPullRequestQuickPicks(ctx);

    // Then
    assert.strictEqual(result.length, 3);

    // Verify sorting by date (most recent first)
    // PR3 (today) -> PR1 (yesterday) -> PR2 (two days ago)
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, mostRecentPullRequest.head.ref);
    assert.strictEqual(firstItem.description, mostRecentPullRequest.title);
    assert.strictEqual(firstItem.detail, `Remote last modified: ${formatDate(mostRecentPullRequest.updatedAt)}`);
    assert.strictEqual(firstItem.pullRequestHead.ref, mostRecentPullRequest.head.ref);

    const secondItem = result[1]!;
    assert.strictEqual(secondItem.label, middlePullRequest.head.ref);
    assert.strictEqual(secondItem.description, middlePullRequest.title);
    assert.strictEqual(secondItem.detail, `Remote last modified: ${formatDate(middlePullRequest.updatedAt)}`);
    assert.strictEqual(secondItem.pullRequestHead.ref, middlePullRequest.head.ref);

    const thirdItem = result[2]!;
    assert.strictEqual(thirdItem.label, oldestPullRequest.head.ref);
    assert.strictEqual(thirdItem.description, oldestPullRequest.title);
    assert.strictEqual(thirdItem.detail, `Remote last modified: ${formatDate(oldestPullRequest.updatedAt)}`);
    assert.strictEqual(thirdItem.pullRequestHead.ref, oldestPullRequest.head.ref);
  });

  test("should handle errors fetching pull requests", async () => {
    // Given
    const error = new Error("Failed to fetch pull requests");
    const [oldestPullRequest] = createPullRequests();
    const [repository1, repository2] = createRepositories([oldestPullRequest], error);
    const ctx = createCtx({ getAllRepositories: [repository1, repository2] });

    // When
    const result = await createCheckoutPullRequestQuickPicks(ctx);

    // Then
    assert.strictEqual(result.length, 1);
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, oldestPullRequest.head.ref);
    assert.strictEqual(firstItem.pullRequestHead.ref, oldestPullRequest.head.ref);
  });

  test("should return empty array when no pull requests are found", async () => {
    // Given
    const ctx = createCtx({ getAllRepositories: [] });

    // When
    const result = await createCheckoutPullRequestQuickPicks(ctx);

    // Then
    assert.strictEqual(result.length, 0);
  });
});
