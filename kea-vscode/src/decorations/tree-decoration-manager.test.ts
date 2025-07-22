import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { IssueCommentsPayload } from "../repository/repository";
import { createAccountStub, createIssueCommentStub, createRemoteRepositoryStub, stubEvents } from "../test-utils";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { createCommentsRootDecorationUri } from "./decoration-schemes";
import { TreeDecorationManager } from "./tree-decoration-manager";

// Create a test provider that extends BaseTreeDecorationProvider for testing
class TestTreeDecorationProvider extends BaseTreeDecorationProvider {
  // Mock implementation
  provideFileDecoration = (_uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> => {
    return null;
  };
}

suite("TreeDecorationManager", () => {

  const createTestProvider = () => new TestTreeDecorationProvider();

  const createRepoWithEventStub = (stub = sinon.stub()) => {
    const repo = createRemoteRepositoryStub();
    repo.onDidChangeIssueComments = stub;
    return repo;
  };

  const setupTestData = () => {
    const accountKey = { providerId: "github", accountId: "accountId" };
    const repoId = { owner: "owner", repo: "repo" };
    const pullId = { ...repoId, number: 1 };

    // Create repository with event emitters
    const { stub: repository, eventFirers } = stubEvents(
      createRemoteRepositoryStub({
        account: createAccountStub({ accountKey }),
        repoId,
      }),
      ["onDidChangeIssueComments"] as const,
    );

    return { accountKey, repoId, pullId, repository, eventFirers };
  };

const setupStubs = () => {
  const sandbox = sinon.createSandbox();
  const mockScheme = "test-scheme";
  const mockUri = vscode.Uri.parse(`${mockScheme}:/test/path`);
  const mockEvent = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  const mockDisposable = { dispose: sandbox.stub() };

  return {
    sandbox,
    mockScheme,
    mockUri,
    mockEvent,
    mockDisposable,
  };
};

suite("TreeDecorationManager", () => {

  test("registerProviders adds providers and registers them with vscode", () => {
    // Given
    const manager = new TreeDecorationManager();
    const provider1 = createTestProvider();
    const provider2 = createTestProvider();

    const registerStub = sandbox.stub(vscode.window, "registerFileDecorationProvider").returns({
      dispose: () => {
        /* empty for testing */
      },
    });

    // When
    manager.registerProviders(provider1, provider2);

    // Then
    assert.strictEqual(registerStub.callCount, 2, "Should register two providers");
    assert.ok(registerStub.calledWith(provider1), "Should register the first provider");
    assert.ok(registerStub.calledWith(provider2), "Should register the second provider");
  });

  test("updateListeners disposes old listeners and creates new ones", () => {
    // Given
    const manager = new TreeDecorationManager();
    const disposableMock = { dispose: sinon.stub() };

    // Create repositories with stubbed events
    const onDidChangeStub1 = sinon.stub().returns(disposableMock);
    const onDidChangeStub2 = sinon.stub().returns(disposableMock);
    const repository1 = createRepoWithEventStub(onDidChangeStub1);
    const repository2 = createRepoWithEventStub(onDidChangeStub2);

    // When - first update
    manager.updateListeners(repository1);

    // Then
    assert.strictEqual(onDidChangeStub1.callCount, 1, "onDidChangeIssueComments should be called once for repository1");

    // When - second update should dispose previous listener
    manager.updateListeners(repository1, repository2);

    // Then
    assert.strictEqual(onDidChangeStub1.callCount, 2, "onDidChangeIssueComments should be called twice for repository1");
    assert.strictEqual(onDidChangeStub2.callCount, 1, "onDidChangeIssueComments should be called once for repository2");
    assert.strictEqual(disposableMock.dispose.callCount, 1, "dispose should be called once to clean up old listeners");
  });

  test("onDidChangeIssueComments refreshes providers with the correct URI", () => {
    // Given
    const manager = new TreeDecorationManager();
    const provider = createTestProvider();
    manager.registerProviders(provider);

    const refreshSpy = sandbox.spy(provider, "refresh");

    const { accountKey, pullId, repository, eventFirers } = setupTestData();

    // Set up listeners
    manager.updateListeners(repository);

    // When - fire event with comments
    const comments = [createIssueCommentStub({ id: 1, body: "Test comment" })];
    const payload: IssueCommentsPayload = { issueId: pullId, comments };
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(refreshSpy.callCount, 1, "Provider refresh should be called once");

    // Check correct URI was passed
    const expectedUri = createCommentsRootDecorationUri({
      pullId,
      accountKey,
    });

    const actualUri = refreshSpy.firstCall.args[0];
    assert.strictEqual(actualUri.scheme, expectedUri.scheme);
    assert.strictEqual(actualUri.query, expectedUri.query);
  });

  test("onDidChangeIssueComments does not refresh providers when comments is an Error", () => {
    // Given
    const manager = new TreeDecorationManager();
    const provider = createTestProvider();
    manager.registerProviders(provider);

    const refreshSpy = sandbox.spy(provider, "refresh");

    // Create repository with event emitters
    const { repository, eventFirers } = setupTestData();

    // Set up listeners
    manager.updateListeners(repository);

    // When - fire event with error
    const error = new Error("Issue comments API call failed");
    const payload: IssueCommentsPayload = {
      issueId: { owner: "owner", repo: "repo", number: 1 },
      comments: error,
    };
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(refreshSpy.callCount, 0, "Provider refresh should not be called for errors");
  });

  test("Multiple providers are all refreshed when issue comments change", () => {
    // Given
    const manager = new TreeDecorationManager();
    const provider1 = createTestProvider();
    const provider2 = createTestProvider();

    manager.registerProviders(provider1, provider2);

    // Mock the refresh methods
    const refreshSpy1 = sandbox.spy(provider1, "refresh");
    const refreshSpy2 = sandbox.spy(provider2, "refresh");

    const { pullId, repository, eventFirers } = setupTestData();

    // Set up listeners
    manager.updateListeners(repository);

    // When - fire event with comments
    const comments = [createIssueCommentStub({ id: 1, body: "Test comment" })];
    const payload: IssueCommentsPayload = { issueId: pullId, comments };
    eventFirers.onDidChangeIssueComments(payload);

    // Then
    assert.strictEqual(refreshSpy1.callCount, 1, "First provider refresh should be called once");
    assert.strictEqual(refreshSpy2.callCount, 1, "Second provider refresh should be called once");

    // Verify both were called with the same URI
    assert.deepStrictEqual(refreshSpy1.firstCall.args[0], refreshSpy2.firstCall.args[0]);
  });

  test("dispose should clean up all repository listeners", async () => {
    // Given
    const manager = new TreeDecorationManager();
    const disposableMock = { dispose: sinon.stub() };

    // Create listener stubs
    const onDidChangeStub1 = sinon.stub().returns(disposableMock);
    const onDidChangeStub2 = sinon.stub().returns(disposableMock);

    // Create repository stubs with mocked onDidChangeIssueComments
    const repository1 = createRepoWithEventStub(onDidChangeStub1);
    const repository2 = createRepoWithEventStub(onDidChangeStub2);

    // Register repositories to create listeners
    manager.updateListeners(repository1, repository2);

    // Reset the dispose stub count to ensure we're only counting disposes from _dispose
    disposableMock.dispose.resetHistory();

    // When - dispose the manager
    await manager.dispose();

    // Then
    assert.strictEqual(disposableMock.dispose.callCount, 2, "All repository listeners should be disposed");

    // Make sure subsequent calls to updateListeners work correctly
    disposableMock.dispose.resetHistory();

    // When - update listeners after disposing
    manager.updateListeners(repository1);

    // Then
    assert.strictEqual(onDidChangeStub1.callCount, 2, "onDidChangeIssueComments should be called again after dispose");
  });

  test("dispose should be idempotent", async () => {
    // Given
    const manager = new TreeDecorationManager();
    const disposableMock = { dispose: sinon.stub() };
    const onDidChangeStub = sinon.stub().returns(disposableMock);

    // Create repository stub with mocked onDidChangeIssueComments
    const repository = createRepoWithEventStub(onDidChangeStub);

    // Register repository to create listener
    manager.updateListeners(repository);

    // Reset the dispose stub count
    disposableMock.dispose.resetHistory();

    // When - dispose the manager multiple times
    await manager.dispose();
    await manager.dispose();

    // Then
    assert.strictEqual(disposableMock.dispose.callCount, 1, "Listener should only be disposed once");
  });
});
