import * as assert from "assert";
import sinon from "sinon";
import { formatDate } from "../core/utils";
import { IRepository } from "../repository/repository";
import {
  createAccountStub,
  createKeaContextStub,
  createPullRequestStub,
  createRemoteRepositoryStub,
  createRepositoryManagerStub,
  createRepositoryStub,
} from "../test-utils";
import { PullRequest } from "../types/kea";
import { createPullRequestListQuickPick } from "./pull-request-list-picks";

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
  const repository1 = createRepositoryStub({
    remoteRepository: createRemoteRepositoryStub({
      getPullRequestList: sinon.stub().resolves(repository1PullRequests),
    }),
  });

  // Create a second repository with a different account
  const repository2 = createRepositoryStub({
    remoteRepository: createRemoteRepositoryStub({
      account: createAccountStub({
        accountKey: {
          providerId: "providerId1",
          accountId: "accountId1",
        },
      }),
      getPullRequestList: sinon.stub().resolves(repository2PullRequests),
    }),
  });

  return { repository1, repository2 };
};

const createStubs = (
  stubs: {
    getAllRepositories?: IRepository[];
  } = {},
) => {
  const repositoryManager = createRepositoryManagerStub({
    getAllRepositories: sinon.stub().returns(stubs.getAllRepositories ?? []),
  });
  const ctx = createKeaContextStub({ repositoryManager });

  return { ctx };
};

suite("pull-request-list-picks", () => {
  test("should return pull request list picks sorted by updatedAt", async () => {
    // Given - deliberate unsorted order in the repository responses
    const [oldestPullRequest, middlePullRequest, mostRecentPullRequest] = createPullRequests();
    // First repo returns PRs in reverse chronological order
    const { repository1, repository2 } = createRepositories([middlePullRequest, oldestPullRequest], [mostRecentPullRequest]);
    const { ctx } = createStubs({
      getAllRepositories: [repository1, repository2],
    });

    // When
    const result = await createPullRequestListQuickPick(ctx);

    // Then
    assert.strictEqual(result.length, 3);

    // Verify sorting by date (most recent first)
    // PR3 (today) -> PR1 (yesterday) -> PR2 (two days ago)
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, mostRecentPullRequest.title);
    assert.strictEqual(firstItem.description, mostRecentPullRequest.url);
    assert.strictEqual(firstItem.detail, `Last modified: ${formatDate(mostRecentPullRequest.updatedAt)}`);
    assert.strictEqual(firstItem.pullRequestId.number, mostRecentPullRequest.number);

    const secondItem = result[1]!;
    assert.strictEqual(secondItem.label, middlePullRequest.title);
    assert.strictEqual(secondItem.description, middlePullRequest.url);
    assert.strictEqual(secondItem.detail, `Last modified: ${formatDate(middlePullRequest.updatedAt)}`);
    assert.strictEqual(secondItem.pullRequestId.number, middlePullRequest.number);

    const thirdItem = result[2]!;
    assert.strictEqual(thirdItem.label, oldestPullRequest.title);
    assert.strictEqual(thirdItem.description, oldestPullRequest.url);
    assert.strictEqual(thirdItem.detail, `Last modified: ${formatDate(oldestPullRequest.updatedAt)}`);
    assert.strictEqual(thirdItem.pullRequestId.number, oldestPullRequest.number);
  });

  test("should handle errors fetching pull requests", async () => {
    // Given
    const error = new Error("Failed to fetch pull requests");
    const [oldestPullRequest] = createPullRequests();
    const { repository1, repository2 } = createRepositories([oldestPullRequest], error);
    const ctx = createStubs({
      getAllRepositories: [repository1, repository2],
    }).ctx;

    // When
    const result = await createPullRequestListQuickPick(ctx);

    // Then
    assert.strictEqual(result.length, 1);
    const firstItem = result[0]!;
    assert.strictEqual(firstItem.label, oldestPullRequest.title);
    assert.deepStrictEqual(firstItem.pullRequestId.number, oldestPullRequest.number);
  });

  test("should return empty array when no pull requests are found", async () => {
    // Given
    const { ctx } = createStubs({
      getAllRepositories: [],
    });

    // When
    const result = await createPullRequestListQuickPick(ctx);

    // Then
    assert.strictEqual(result.length, 0);
  });
});
