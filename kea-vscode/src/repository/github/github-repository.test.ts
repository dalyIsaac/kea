import * as assert from "assert";
import sinon from "sinon";
import { GitHubAccount } from "../../account/github/github-account";
import { ICacheValue } from "../../cache/lru-api/cache-types";
import { createAccountStub, createCacheStub, stubEvents } from "../../test-utils";
import { IssueId, PullRequestId, RepoId } from "../../types/kea";
import { IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../kea-repository";
import { GitHubRepository } from "./github-repository";

suite("GitHubRepository", () => {
  // Test fixtures
  const createRepoId = (): RepoId => ({
    owner: "test-owner",
    repo: "test-repo",
  });

  const createPullRequestId = (): PullRequestId => ({
    ...createRepoId(),
    number: 123,
  });

  const createIssueId = (): IssueId => ({
    ...createRepoId(),
    number: 123,
  });

  const createCommitSha = (): string => "abc123def456";

  const createOctokitStub = () => ({
    request: sinon.stub(),
  });

  const createTestGitHubRepository = () => {
    // Set up stubs
    const octokitStub = createOctokitStub();

    // Mock the GitHub account
    const githubAccount = createAccountStub() as unknown as GitHubAccount;
    githubAccount.getOctokit = sinon.stub().resolves(octokitStub);

    // Mock the cache with proper typed stubs
    const cache = createCacheStub();
    (cache.get as sinon.SinonStub).returns(undefined);

    // Create the repository instance
    const repository = new GitHubRepository("https://github.com/test-owner/test-repo", createRepoId(), githubAccount, cache);

    return { repository, octokitStub, githubAccount, cache };
  };

  // Create the mock API response objects
  const createPullRequestListResponse = (wasCached = false) => ({
    data: [createPullRequestResponse().data],
    headers: {
      etag: "etag123",
      "last-modified": "last-modified-date",
    },
    wasCached,
  });

  const createPullRequestResponse = (wasCached = false) => ({
    data: {
      id: 1,
      number: 123,
      title: "Test PR",
      state: "open",
      created_at: "2025-04-15T12:00:00Z",
      updated_at: "2025-04-16T14:00:00Z",
      closed_at: null,
      merged_at: null,
      draft: false,
      user: {
        login: "test-user",
      },
      base: {
        repo: {
          name: "test-repo",
          owner: {
            login: "test-owner",
          },
        },
        ref: "main",
        sha: "abc123def456",
      },
      head: {
        repo: {
          name: "test-repo",
          owner: {
            login: "test-owner",
          },
        },
        ref: "test-branch",
        sha: "def456abc123",
      },
    },
    headers: {
      etag: "etag123",
      "last-modified": "last-modified-date",
    },
    wasCached,
  });

  const createIssueCommentsResponse = (wasCached = false) => ({
    data: [
      {
        id: 1,
        body: "Test comment",
        created_at: "2025-04-15T12:00:00Z",
        updated_at: "2025-04-16T14:00:00Z",
        user: {
          login: "test-user",
          avatar_url: "https://avatar.url",
        },
      },
    ],
    headers: {
      etag: "etag123",
      "last-modified": "last-modified-date",
    },
    wasCached,
  });

  const createPullRequestReviewCommentsResponse = (wasCached = false) => ({
    data: [
      {
        id: 1,
        body: "Test review comment",
        created_at: "2025-04-15T12:00:00Z",
        updated_at: "2025-04-16T14:00:00Z",
        user: {
          login: "test-user",
          avatar_url: "https://avatar.url",
        },
        path: "test/file.ts",
        line: 42,
        start_line: 40,
        original_line: 35,
        original_start_line: 35,
        side: "RIGHT" as const,
        start_side: "RIGHT" as const,
        in_reply_to_id: null,
      },
    ],
    headers: {
      etag: "etag123",
      "last-modified": "last-modified-date",
    },
    wasCached,
  });

  const createPullRequestFilesResponse = (wasCached = false) => ({
    data: [
      {
        filename: "test/file.ts",
        status: "modified",
        sha: "abc123",
        additions: 10,
        deletions: 5,
        changes: 15,
        patch: "@@ -1,5 +1,10 @@",
        blob_url: "https://blob.url",
        raw_url: "https://raw.url",
        contents_url: "https://contents.url",
      },
    ],
    headers: {
      etag: "etag123",
      "last-modified": "last-modified-date",
    },
    wasCached,
  });

  const createCommitFilesResponse = (wasCached = false) => ({
    data: {
      files: [
        {
          filename: "src/test.ts",
          status: "modified",
          sha: "def456",
          additions: 5,
          deletions: 2,
          changes: 7,
          patch: "@@ -1,1 +1,1 @@",
          blob_url: "https://blob.url/test",
          raw_url: "https://raw.url/test",
          contents_url: "https://contents.url/test",
        },
      ],
    },
    headers: {
      etag: "etag456",
      "last-modified": "last-modified-date-commit",
    },
    wasCached,
  });

  const createCommitCommentsResponse = (wasCached = false) => ({
    data: [
      {
        id: 10,
        body: "Test commit comment",
        created_at: "2025-04-18T10:00:00Z",
        updated_at: "2025-04-18T11:00:00Z",
        user: {
          login: "commenter-user",
          avatar_url: "https://commenter.avatar.url",
        },
        path: "src/test.ts",
        line: 10,
        position: 5, // Position within the diff hunk
        commit_id: "abc123def456",
        html_url: "https://comment.url",
      },
    ],
    headers: {
      etag: "etag789",
      "last-modified": "last-modified-date-comment",
    },
    wasCached,
  });

  suite("getPullRequestList", () => {
    test("returns pull requests successfully when API call succeeds", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const mockResponse = createPullRequestListResponse();

      octokitStub.request.resolves(mockResponse);
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getPullRequestList();

      // Then - result type checking
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check the content of the first pull request
      const pr = result[0];
      assert.ok(pr, "Expected result[0] to exist");
      assert.strictEqual(pr.number, 123);
      assert.strictEqual(pr.title, "Test PR");

      // Verify the API call was made correctly
      sinon.assert.calledOnceWithExactly(octokitStub.request, "GET /repos/{owner}/{repo}/pulls", {
        owner: "test-owner",
        repo: "test-repo",
        state: "open",
        sort: "updated",
        direction: "desc",
        per_page: 100,
        headers: {},
      });
    });

    test("uses cached results when available without making API call", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const cachedData = createPullRequestListResponse().data;

      (cache.get as sinon.SinonStub).returns({ data: cachedData, headers: {} } as ICacheValue<unknown>);

      // When
      const result = await repository.getPullRequestList();

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check the content of the first pull request
      const pr = result[0];
      assert.ok(pr, "Expected result[0] to exist");
      assert.strictEqual(pr.number, 123);
      assert.strictEqual(pr.title, "Test PR");

      // Verify the API call was NOT made
      sinon.assert.notCalled(octokitStub.request);
    });

    test("returns error object when request fails", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      octokitStub.request.rejects(new Error("Network error"));
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getPullRequestList();

      // Then
      assert.ok(result instanceof Error, "Expected result to be an Error");
      assert.ok(result.message.includes("Error fetching pull requests"));
    });
  });

  suite("getPullRequest", () => {
    test("returns a pull request successfully when API call succeeds", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      const mockResponse = createPullRequestResponse();

      octokitStub.request.resolves(mockResponse);
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getPullRequest(pullRequestId);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.strictEqual(result.number, 123);
      assert.strictEqual(result.title, "Test PR");

      // Verify the API call was made correctly
      sinon.assert.calledOnceWithExactly(octokitStub.request, "GET /repos/{owner}/{repo}/pulls/{pull_number}", {
        owner: "test-owner",
        repo: "test-repo",
        pull_number: 123,
        headers: {},
      });
    });

    test("returns error object when request fails", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      octokitStub.request.rejects(new Error("Network error"));
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getPullRequest(pullRequestId);

      // Then
      assert.ok(result instanceof Error, "Expected result to be an Error");
      assert.ok(result.message.includes("Error fetching pull request"));
    });
  });

  suite("getIssueComments", () => {
    test("returns issue comments successfully and fires change event", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const issueId = createIssueId();
      const commentsResponse = createIssueCommentsResponse();

      // Clear cache and ensure fresh response
      (cache.get as sinon.SinonStub).returns(undefined);

      // Mock octokit response with fresh data (not cached)
      octokitStub.request.resolves({
        data: commentsResponse.data,
        headers: commentsResponse.headers,
        status: 200,
      });

      // Set up event listening with real EventEmitter
      const onDidChangeEventSpy = sinon.spy();
      originalRepo.onDidChangeIssueComments(onDidChangeEventSpy);

      // When
      const result = await originalRepo.getIssueComments(issueId);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check content of the first comment
      const comment = result[0];
      assert.ok(comment, "Expected result[0] to exist");
      assert.strictEqual(comment.body, "Test comment");

      // Verify the event was fired
      assert.ok(onDidChangeEventSpy.calledOnce, "Expected event to be fired exactly once");

      // Verify the event payload
      const eventPayload = onDidChangeEventSpy.firstCall.args[0] as IssueCommentsPayload;
      assert.deepStrictEqual(eventPayload.issueId, issueId);
      assert.deepStrictEqual(eventPayload.comments, result);
    });

    test("does not fire event when using cached results", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const issueId = createIssueId();
      const cachedData = createIssueCommentsResponse().data;

      // Set up cache to return data
      (cache.get as sinon.SinonStub).returns({ data: cachedData, headers: {} } as ICacheValue<unknown>);

      // Mock request to simulate a cached response when called
      octokitStub.request.resolves({
        data: cachedData,
        headers: {},
        wasCached: true,
      });

      // Mock the event emitter
      const eventsStub = stubEvents(originalRepo, ["onDidChangeIssueComments"]);
      const repository = eventsStub.stub;
      const fireEvent = eventsStub.eventFirers.onDidChangeIssueComments;
      const eventSpy = sinon.spy(fireEvent);

      // When
      await repository.getIssueComments(issueId);

      // Then - Event should not have been fired
      assert.ok(!eventSpy.called, "Expected event not to be fired");
    });

    test("returns error object when request fails", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const issueId = createIssueId();
      octokitStub.request.rejects(new Error("Network error"));
      (cache.get as sinon.SinonStub).returns(undefined);

      // Mock the event emitter
      const eventsStub = stubEvents(originalRepo, ["onDidChangeIssueComments"]);
      const repository = eventsStub.stub;

      // When
      const result = await repository.getIssueComments(issueId);

      // Then
      assert.ok(result instanceof Error, "Expected result to be an Error");
      assert.ok(result.message.includes("Error fetching issue comments"));
    });
  });

  suite("getPullRequestReviewComments", () => {
    test("returns review comments successfully and fires change event", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      const commentsResponse = createPullRequestReviewCommentsResponse();

      // Clear cache and ensure fresh response
      (cache.get as sinon.SinonStub).returns(undefined);

      // Mock octokit response with fresh data (not cached)
      octokitStub.request.resolves({
        data: commentsResponse.data,
        headers: commentsResponse.headers,
        status: 200,
      });

      // Set up event listening with real EventEmitter
      const onDidChangeEventSpy = sinon.spy();
      originalRepo.onDidChangePullRequestReviewComments(onDidChangeEventSpy);

      // When
      const result = await originalRepo.getPullRequestReviewComments(pullRequestId);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check content of the first comment
      const comment = result[0];
      assert.ok(comment, "Expected result[0] to exist");
      assert.strictEqual(comment.body, "Test review comment");
      assert.strictEqual(comment.path, "test/file.ts");

      // Verify the event was fired
      assert.ok(onDidChangeEventSpy.calledOnce, "Expected event to be fired exactly once");

      // Verify the event payload
      const eventPayload = onDidChangeEventSpy.getCalls()[0]!.args[0] as PullRequestReviewCommentsPayload;
      assert.deepStrictEqual(eventPayload.pullId, pullRequestId);
      assert.deepStrictEqual(eventPayload.comments, result);
    });

    test("does not fire event when using cached results", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      const cachedData = createPullRequestReviewCommentsResponse().data;

      // Set up cache to return data
      (cache.get as sinon.SinonStub).returns({ data: cachedData, headers: {} } as ICacheValue<unknown>);

      // Mock request to simulate a cached response when called
      octokitStub.request.resolves({
        data: cachedData,
        headers: {},
        wasCached: true,
      });

      // Mock the event emitter
      const eventsStub = stubEvents(originalRepo, ["onDidChangePullRequestReviewComments"]);
      const repository = eventsStub.stub;
      const fireEvent = eventsStub.eventFirers.onDidChangePullRequestReviewComments;
      const eventSpy = sinon.spy(fireEvent);

      // When
      await repository.getPullRequestReviewComments(pullRequestId);

      // Then - Event should not have been fired
      assert.ok(!eventSpy.called, "Expected event not to be fired");
    });

    test("returns error object when request fails", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      octokitStub.request.rejects(new Error("Network error"));
      (cache.get as sinon.SinonStub).returns(undefined);

      // Mock the event emitter
      const eventsStub = stubEvents(originalRepo, ["onDidChangePullRequestReviewComments"]);
      const repository = eventsStub.stub;

      // When
      const result = await repository.getPullRequestReviewComments(pullRequestId);

      // Then
      assert.ok(result instanceof Error, "Expected result to be an Error");
      assert.ok(result.message.includes("Error fetching pull request comments"));
    });
  });

  suite("getPullRequestFiles", () => {
    test("returns pull request files successfully when API call succeeds", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      const mockResponse = createPullRequestFilesResponse();

      octokitStub.request.resolves(mockResponse);
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getPullRequestFiles(pullRequestId);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check content of the first file
      const file = result[0];
      assert.ok(file, "Expected result[0] to exist");
      assert.strictEqual(file.filename, "test/file.ts");
      assert.strictEqual(file.status, "modified");
      assert.strictEqual(file.additions, 10);

      // Verify the API call was made correctly
      sinon.assert.calledOnceWithExactly(octokitStub.request, "GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
        owner: "test-owner",
        repo: "test-repo",
        pull_number: 123,
        headers: {},
      });
    });

    test("returns error object when request fails", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      octokitStub.request.rejects(new Error("Network error"));
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getPullRequestFiles(pullRequestId);

      // Then
      assert.ok(result instanceof Error, "Expected result to be an Error");
      assert.ok(result.message.includes("Error fetching pull request files"));
    });
  });

  suite("getPullRequestCommits", () => {
    const createPullRequestCommitsResponse = (wasCached = false) => ({
      data: [
        {
          sha: "abc123def456",
          commit: {
            message: "Test commit message",
            author: {
              name: "Test Author",
              email: "test@example.com",
            },
            committer: {
              name: "Test Committer",
              email: "committer@example.com",
            },
            comment_count: 0,
            tree: {
              sha: "tree-sha-123",
              url: "https://tree.url",
            },
          },
          author: {
            login: "test-user",
            avatar_url: "https://avatar.url",
            name: "Test Author",
          },
          committer: {
            login: "test-committer",
            avatar_url: "https://committer-avatar.url",
            name: "Test Committer",
          },
          html_url: "https://commit.url",
        },
      ],
      headers: {
        etag: "etag123",
        "last-modified": "last-modified-date",
      },
      wasCached,
    });

    test("returns pull request commits successfully when API call succeeds", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      const mockResponse = createPullRequestCommitsResponse();

      octokitStub.request.resolves(mockResponse);
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getPullRequestCommits(pullRequestId);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check content of the first commit
      const commit = result[0];
      assert.ok(commit, "Expected result[0] to exist");
      assert.strictEqual(commit.sha, "abc123def456");
      assert.strictEqual(commit.commit.message, "Test commit message");
      assert.strictEqual(commit.commit.author?.name, "Test Author");

      // Verify the API call was made correctly
      sinon.assert.calledOnceWithExactly(octokitStub.request, "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits", {
        owner: "test-owner",
        repo: "test-repo",
        pull_number: 123,
        headers: {},
      });
    });

    test("uses cached results when available without making API call", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      const cachedData = createPullRequestCommitsResponse().data;

      (cache.get as sinon.SinonStub).returns({ data: cachedData, headers: {} } as ICacheValue<unknown>);

      // When
      const result = await repository.getPullRequestCommits(pullRequestId);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check content of the first commit
      const commit = result[0];
      assert.ok(commit, "Expected result[0] to exist");
      assert.strictEqual(commit.sha, "abc123def456");
      assert.strictEqual(commit.commit.message, "Test commit message");
      assert.strictEqual(commit.commit.author?.name, "Test Author");

      // Verify the API call was NOT made
      sinon.assert.notCalled(octokitStub.request);
    });

    test("returns error object when request fails", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const pullRequestId = createPullRequestId();
      octokitStub.request.rejects(new Error("Network error"));
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getPullRequestCommits(pullRequestId);

      // Then
      assert.ok(result instanceof Error, "Expected result to be an Error");
      assert.ok(result.message.includes("Error fetching pull request commits"));
    });
  });

  suite("getCommitFiles", () => {
    test("returns commit files successfully when API call succeeds", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const commitSha = createCommitSha();
      const mockResponse = createCommitFilesResponse();

      octokitStub.request.resolves(mockResponse);
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getCommitFiles(commitSha);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check content of the first file
      const file = result[0];
      assert.ok(file, "Expected result[0] to exist");
      assert.strictEqual(file.filename, "src/test.ts");
      assert.strictEqual(file.status, "modified");
      assert.strictEqual(file.additions, 5);

      // Verify the API call was made correctly
      sinon.assert.calledOnceWithExactly(octokitStub.request, "GET /repos/{owner}/{repo}/commits/{ref}", {
        owner: "test-owner",
        repo: "test-repo",
        ref: commitSha,
        headers: {},
      });
    });

    test("uses cached results when available without making API call", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const commitSha = createCommitSha();
      // Correct: Cache should store the full data object returned by the API endpoint
      const cachedData = createCommitFilesResponse().data;

      (cache.get as sinon.SinonStub).returns({ data: cachedData, headers: {} } as ICacheValue<unknown>);

      // When
      const result = await repository.getCommitFiles(commitSha);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check content of the first file
      const file = result[0];
      assert.ok(file, "Expected result[0] to exist");
      assert.strictEqual(file.filename, "src/test.ts");
      assert.strictEqual(file.status, "modified");

      // Verify the API call was NOT made
      sinon.assert.notCalled(octokitStub.request);
    });

    test("returns error object when request fails", async () => {
      // Given
      const { repository, octokitStub, cache } = createTestGitHubRepository();
      const commitSha = createCommitSha();
      octokitStub.request.rejects(new Error("Network error"));
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await repository.getCommitFiles(commitSha);

      // Then
      assert.ok(result instanceof Error, "Expected result to be an Error");
      assert.ok(result.message.includes("Error fetching commit files"));
    });
  });

  suite("getCommitComments", () => {
    test("returns commit comments successfully", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const commitSha = createCommitSha();
      const commentsResponse = createCommitCommentsResponse();

      // Clear cache and ensure fresh response
      (cache.get as sinon.SinonStub).returns(undefined);

      // Mock octokit response with fresh data (not cached)
      octokitStub.request.resolves({
        data: commentsResponse.data,
        headers: commentsResponse.headers,
        status: 200,
      });

      // When
      const result = await originalRepo.getCommitComments(commitSha);

      // Then
      assert.ok(!(result instanceof Error), "Expected result not to be an Error");
      assert.ok(Array.isArray(result), "Expected result to be an array");
      assert.strictEqual(result.length, 1);

      // Check content of the first comment
      const comment = result[0];
      assert.ok(comment, "Expected result[0] to exist");
      assert.strictEqual(comment.body, "Test commit comment");
      assert.strictEqual(comment.path, "src/test.ts");

      // Verify the API call was made correctly
      sinon.assert.calledOnceWithExactly(octokitStub.request, "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments", {
        owner: "test-owner",
        repo: "test-repo",
        commit_sha: commitSha,
        headers: {},
      });
    });

    test("does not make API call when using cached results", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const commitSha = createCommitSha();
      const cachedData = createCommitCommentsResponse().data;

      // Set up cache to return data
      (cache.get as sinon.SinonStub).returns({ data: cachedData, headers: {} } as ICacheValue<unknown>);

      // Mock request to simulate a cached response when called
      octokitStub.request.resolves({
        data: cachedData,
        headers: {},
        wasCached: true, // Simulate cache hit from API layer
      });

      // When
      await originalRepo.getCommitComments(commitSha); // Use originalRepo

      // Then - API call should NOT happen because cache has data
      sinon.assert.notCalled(octokitStub.request); // Correct assertion
    });

    test("returns error object when request fails", async () => {
      // Given
      const { repository: originalRepo, octokitStub, cache } = createTestGitHubRepository();
      const commitSha = createCommitSha();
      octokitStub.request.rejects(new Error("Network error"));
      (cache.get as sinon.SinonStub).returns(undefined);

      // When
      const result = await originalRepo.getCommitComments(commitSha); // Use originalRepo

      // Then
      assert.ok(result instanceof Error, "Expected result to be an Error");
      assert.ok(result.message.includes("Error fetching commit comments"));
    });
  });

  suite("dispose", () => {
    test("should invalidate the cache on dispose", () => {
      // Given
      const { repository, cache } = createTestGitHubRepository();
      cache.invalidate = sinon.stub();

      // When
      repository.dispose();

      // Then
      assert.strictEqual((cache.invalidate as sinon.SinonStub).calledOnce, true);
    });
  });
});
