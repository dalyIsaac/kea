import * as assert from "assert";
import sinon from "sinon";
import { Logger } from "../../core/logger";
import { createKeaContextStub, createRepositoryStub, createWorkspaceFolderStub } from "../../test-utils";
import { PullRequestListTreeProvider } from "./pull-request-list-tree-provider";
import { RepoTreeNode } from "./repo-tree-node";

suite("PullRequestListTreeProvider", () => {
  let sandbox: sinon.SinonSandbox;
  let contextStub: ReturnType<typeof createKeaContextStub>;
  let treeProvider: PullRequestListTreeProvider;
  let fireStub: sinon.SinonStub;
  let eventEmitterStub: { fire: sinon.SinonStub };

  setup(() => {
    sandbox = sinon.createSandbox();
    contextStub = createKeaContextStub();

    // Create a stub for the EventEmitter.fire method
    eventEmitterStub = { fire: sinon.stub() };

    // Use prototype replacement to avoid issues with the original method
    sandbox.stub(Logger, "error"); // Stub Logger.error method

    // Create the tree provider first
    treeProvider = new PullRequestListTreeProvider(contextStub);

    // Then replace its _onDidChangeTreeData after instantiation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (treeProvider as any)._onDidChangeTreeData = eventEmitterStub;
    fireStub = eventEmitterStub.fire;
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should register repository state change listener on initialization", () => {
    // Then
    assert.ok((contextStub.gitManager.onRepositoryStateChanged as sinon.SinonStub).calledOnce);
  });

  test("should fire tree data change event when repository state changes", () => {
    // Given
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const onRepoStateChangedCallback = (contextStub.gitManager.onRepositoryStateChanged as sinon.SinonStub).getCall(0).args[0];

    // When
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    onRepoStateChangedCallback();

    // Then
    assert.ok(fireStub.calledOnce);
  });

  test("should get root children from repositories", async () => {
    // Given
    const repo1 = createRepositoryStub();
    const workspace1 = createWorkspaceFolderStub();
    const repoInfo = { repository: repo1, workspaceFolder: workspace1 };

    (contextStub.gitManager.getAllRepositoriesAndInfo as sinon.SinonStub).resolves([repoInfo]);

    // When
    const children = await treeProvider.getChildren();

    // Then
    assert.ok((contextStub.gitManager.getAllRepositoriesAndInfo as sinon.SinonStub).calledOnce);
    assert.strictEqual(children.length, 1);
    assert.ok(children[0] instanceof RepoTreeNode);

    const repoNode = children[0];
    assert.strictEqual(repoNode.repository, repo1);
    assert.strictEqual(repoNode.workspace, workspace1);
  });

  test("should handle errors in repository info", async () => {
    // Given
    const error = new Error("Failed to get repo info");
    (contextStub.gitManager.getAllRepositoriesAndInfo as sinon.SinonStub).resolves([error]);

    // When
    const children = await treeProvider.getChildren();

    // Then
    assert.ok((contextStub.gitManager.getAllRepositoriesAndInfo as sinon.SinonStub).calledOnce);
    assert.strictEqual(children.length, 0);
    assert.ok((Logger.error as sinon.SinonStub).calledWith(sinon.match(/Error creating RepoTreeNode/)));
  });

  test("should clear cache when invalidating", () => {
    // When
    treeProvider.refresh(true);

    // Then
    assert.ok((contextStub.apiCache.clear as sinon.SinonStub).calledOnce);
    assert.ok(fireStub.calledOnce);
  });

  test("should clear not cache when just refreshing", () => {
    // When
    treeProvider.refresh();

    // Then
    assert.equal((contextStub.apiCache.clear as sinon.SinonStub).callCount, 0);
    assert.ok(fireStub.calledOnce);
  });
});
