import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { Logger } from "../../core/logger";
import * as quickPickUtils from "../../quick-picks/pull-request-branch-picks";
import { createKeaContextStub, createPullRequestGitRefStub, createWorkspaceFolderStub } from "../../test-utils";
import { Repository } from "../../types/git";
import { ICheckoutPullRequestCommandArgs, createCheckoutPullRequest } from "./checkout-pull-request";

suite("checkout-pull-request", () => {
  let sandbox: sinon.SinonSandbox;
  let contextStub: ReturnType<typeof createKeaContextStub>;
  let workspaceFolder: ReturnType<typeof createWorkspaceFolderStub>;
  let pullRequestHead: ReturnType<typeof createPullRequestGitRefStub>;
  let repositoryStub: Repository;
  let showErrorMessageStub: sinon.SinonStub;
  let loggerInfoStub: sinon.SinonStub;
  let loggerErrorStub: sinon.SinonStub;

  setup(() => {
    sandbox = sinon.createSandbox();

    contextStub = createKeaContextStub();
    workspaceFolder = createWorkspaceFolderStub();
    pullRequestHead = createPullRequestGitRefStub({ ref: "feature-branch" });

    repositoryStub = {} as Repository;
    repositoryStub.checkout = sandbox.stub().resolves();

    showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
    loggerInfoStub = sandbox.stub(Logger, "info");
    loggerErrorStub = sandbox.stub(Logger, "error");
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should checkout branch when args are provided", async () => {
    // Given
    const args: ICheckoutPullRequestCommandArgs = { pullRequestHead, workspaceFolder };
    (contextStub.gitManager.getGitRepository as sinon.SinonStub).resolves(repositoryStub);

    // When
    const command = createCheckoutPullRequest(contextStub);
    await command(args);

    // Then
    assert.ok((contextStub.gitManager.getGitRepository as sinon.SinonStub).calledOnceWithExactly(workspaceFolder));
    assert.ok((repositoryStub.checkout as sinon.SinonStub).calledOnceWithExactly("feature-branch"));
    assert.ok(loggerInfoStub.calledOnceWith("Checked out branch feature-branch"));
  });

  test("should show quick pick and checkout selected branch when args are not provided", async () => {
    // Given
    const showQuickPickStub = sandbox.stub(vscode.window, "showQuickPick");
    const quickPickItem = { pullRequestHead, workspaceFolder, label: "PR #1" };
    showQuickPickStub.resolves(quickPickItem);
    sandbox.stub(quickPickUtils, "createPullRequestBranchPicks").resolves([]);
    (contextStub.gitManager.getGitRepository as sinon.SinonStub).resolves(repositoryStub);

    // When
    const command = createCheckoutPullRequest(contextStub);
    await command();

    // Then
    assert.ok(showQuickPickStub.calledOnce);
    assert.ok((contextStub.gitManager.getGitRepository as sinon.SinonStub).calledOnceWithExactly(workspaceFolder));
    assert.ok((repositoryStub.checkout as sinon.SinonStub).calledOnceWithExactly("feature-branch"));
    assert.ok(loggerInfoStub.calledOnceWith("Checked out branch feature-branch"));
  });

  test("should do nothing if quick pick is cancelled", async () => {
    // Given
    const showQuickPickStub = sandbox.stub(vscode.window, "showQuickPick");
    showQuickPickStub.resolves(undefined);
    sandbox.stub(quickPickUtils, "createPullRequestBranchPicks").resolves([]);

    // When
    const command = createCheckoutPullRequest(contextStub);
    await command();

    // Then
    assert.ok(showQuickPickStub.calledOnce);
    assert.ok((contextStub.gitManager.getGitRepository as sinon.SinonStub).notCalled);
  });

  test("should log error if git repository is not found", async () => {
    // Given
    const args: ICheckoutPullRequestCommandArgs = { pullRequestHead, workspaceFolder };
    const error = new Error("Git repo not found");
    (contextStub.gitManager.getGitRepository as sinon.SinonStub).resolves(error);

    // When
    const command = createCheckoutPullRequest(contextStub);
    await command(args);

    // Then
    assert.ok((contextStub.gitManager.getGitRepository as sinon.SinonStub).calledOnceWithExactly(workspaceFolder));
    assert.ok(loggerErrorStub.calledOnceWith("Error getting repository", error));
  });

  test("should show error message if checkout fails", async () => {
    // Given
    const args: ICheckoutPullRequestCommandArgs = { pullRequestHead, workspaceFolder };
    const checkoutError = new Error("Checkout failed");

    // Override the default stub with one that rejects
    repositoryStub.checkout = sandbox.stub().rejects(checkoutError);
    (contextStub.gitManager.getGitRepository as sinon.SinonStub).resolves(repositoryStub);

    // When
    const command = createCheckoutPullRequest(contextStub);
    await command(args);

    // Then
    assert.ok((contextStub.gitManager.getGitRepository as sinon.SinonStub).calledOnceWithExactly(workspaceFolder));
    assert.ok((repositoryStub.checkout as sinon.SinonStub).calledOnceWithExactly("feature-branch"));
    assert.ok(showErrorMessageStub.calledOnceWith("Failed to checkout branch feature-branch: Checkout failed"));
  });

  test("should show error message with unknown error if checkout fails with non-Error", async () => {
    // Given
    const args: ICheckoutPullRequestCommandArgs = { pullRequestHead, workspaceFolder };
    const checkoutError = "something bad happened";

    // Override the default stub with a function that throws a non-Error
    repositoryStub.checkout = () => {
      // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/only-throw-error
      throw checkoutError;
    };

    (contextStub.gitManager.getGitRepository as sinon.SinonStub).resolves(repositoryStub);

    // When
    const command = createCheckoutPullRequest(contextStub);
    await command(args);

    // Then
    assert.ok((contextStub.gitManager.getGitRepository as sinon.SinonStub).calledOnceWithExactly(workspaceFolder));
    assert.ok(showErrorMessageStub.calledOnce, "showErrorMessage should be called once");
    assert.strictEqual(showErrorMessageStub.getCall(0).args[0], "Failed to checkout branch feature-branch: Unknown error");
  });
});
