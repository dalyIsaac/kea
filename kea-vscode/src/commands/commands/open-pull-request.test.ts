import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { Logger } from "../../core/logger";
import * as quickPickUtils from "../../quick-picks/pull-request-list-picks";
import { createKeaContextStub, createRemoteRepositoryStub } from "../../test-utils";
import { PullRequestId } from "../../types/kea";
import { createOpenPullRequestCommand } from "./open-pull-request";

const setupStubs = () => {
  const sandbox = sinon.createSandbox();

  const contextStub = createKeaContextStub();
  const repositoryStub = createRemoteRepositoryStub();
  const accountKey: IAccountKey = { providerId: "provider", accountId: "acc" };
  const pullId: PullRequestId = { owner: "owner", repo: "repo", number: 123 };

  const loggerErrorStub = sandbox.stub(Logger, "error");
  const showQuickPickStub = sandbox.stub(vscode.window, "showQuickPick");

  // Stub container's treeViewProvider.openPullRequest
  (contextStub.pullRequestContents.treeViewProvider.openPullRequest as sinon.SinonStub) = sinon.stub();

  return {
    sandbox,
    contextStub,
    repositoryStub,
    accountKey,
    pullId,
    loggerErrorStub,
    showQuickPickStub,
  };
};

suite("open-pull-request", () => {

  test("should open pull request when args are provided", async () => {
    // Given
    (contextStub.repositoryManager.getRepositoryById as sinon.SinonStub).returns(repositoryStub);

    // When
    const command = createOpenPullRequestCommand(contextStub);
    await command([accountKey, pullId]);

    // Then
    assert.ok(
      (contextStub.pullRequestContents.treeViewProvider.openPullRequest as sinon.SinonStub).calledOnceWithExactly(accountKey, pullId),
    );
    assert.ok((contextStub.repositoryManager.getRepositoryById as sinon.SinonStub).calledOnceWithExactly(accountKey, pullId));
    assert.ok((contextStub.treeDecorationManager.updateListeners as sinon.SinonStub).calledOnceWithExactly(repositoryStub));
  });

  test("should show quick pick and open selected pull request when args are not provided", async () => {
    // Given
    const quickPickItem: vscode.QuickPickItem & { accountKey: IAccountKey; pullRequestId: PullRequestId } = {
      accountKey,
      pullRequestId: pullId,
      label: "PR #123",
      alwaysShow: false,
      description: "Test PR",
      detail: "Last modified: today",
    };
    showQuickPickStub.resolves(quickPickItem);
    sandbox.stub(quickPickUtils, "createPullRequestListQuickPick").resolves([]);
    (contextStub.repositoryManager.getRepositoryById as sinon.SinonStub).returns(repositoryStub);

    // When
    const command = createOpenPullRequestCommand(contextStub);
    await command();

    // Then
    assert.ok(showQuickPickStub.calledOnce);
    assert.ok(
      (contextStub.pullRequestContents.treeViewProvider.openPullRequest as sinon.SinonStub).calledOnceWithExactly(accountKey, pullId),
    );
    assert.ok((contextStub.repositoryManager.getRepositoryById as sinon.SinonStub).calledOnceWithExactly(accountKey, pullId));
    assert.ok((contextStub.treeDecorationManager.updateListeners as sinon.SinonStub).calledOnceWithExactly(repositoryStub));
  });

  test("should do nothing if quick pick is cancelled", async () => {
    // Given
    showQuickPickStub.resolves(undefined);
    sandbox.stub(quickPickUtils, "createPullRequestListQuickPick").resolves([]);

    // When
    const command = createOpenPullRequestCommand(contextStub);
    await command();

    // Then
    assert.ok(showQuickPickStub.calledOnce);
    assert.ok((contextStub.pullRequestContents.treeViewProvider.openPullRequest as sinon.SinonStub).notCalled);
    assert.ok((contextStub.repositoryManager.getRepositoryById as sinon.SinonStub).notCalled);
    assert.ok((contextStub.treeDecorationManager.updateListeners as sinon.SinonStub).notCalled);
  });

  test("should log error if repository is not found", async () => {
    // Given
    const error = new Error("Repo not found");
    (contextStub.repositoryManager.getRepositoryById as sinon.SinonStub).returns(error);

    // When
    const command = createOpenPullRequestCommand(contextStub);
    await command([accountKey, pullId]);

    // Then
    assert.ok(
      (contextStub.pullRequestContents.treeViewProvider.openPullRequest as sinon.SinonStub).calledOnceWithExactly(accountKey, pullId),
    );
    assert.ok((contextStub.repositoryManager.getRepositoryById as sinon.SinonStub).calledOnceWithExactly(accountKey, pullId));
    assert.ok(loggerErrorStub.calledOnceWith("Error getting repository", error));
    assert.ok((contextStub.treeDecorationManager.updateListeners as sinon.SinonStub).notCalled);
  });
});
