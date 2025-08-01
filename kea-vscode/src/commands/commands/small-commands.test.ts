import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { createKeaContextStub } from "../../test-utils";
import {
  createCollapsePullRequestTreeCommand,
  createRefreshPullRequestContentsCommand,
  createRefreshPullRequestListCommand,
} from "./small-commands";

suite("small-commands", () => {
  suite("createRefreshPullRequestListCommand", () => {
    test("should call refresh on pullRequestListTreeProvider", () => {
      const contextStub = createKeaContextStub();
      // Replace stub to spy on treeViewProvider
      const refreshStub = contextStub.pullRequestListTree.treeViewProvider.refresh as sinon.SinonStub;
      // When
      const command = createRefreshPullRequestListCommand(contextStub);
      command();

      // Then
      assert.ok(refreshStub.calledOnce);
    });
  });

  suite("createRefreshPullRequestContentsCommand", () => {
    test("should call refresh on pullRequestContentsProvider", () => {
      const contextStub = createKeaContextStub();
      const refreshStub = contextStub.pullRequestContents.treeViewProvider.refresh as sinon.SinonStub;
      // When
      const command = createRefreshPullRequestContentsCommand(contextStub);
      command();

      // Then
      assert.ok(refreshStub.calledOnce);
    });
  });

  suite("createCollapsePullRequestTreeCommand", () => {
    test("should execute the collapseAll command", async () => {
      // Given
      const executeCommandStub = sinon.stub(vscode.commands, "executeCommand");

      // When
      const command = createCollapsePullRequestTreeCommand();
      await command();

      // Then
      assert.ok(executeCommandStub.calledOnceWith("workbench.actions.treeView.kea.pullRequestContents.collapseAll"));
    });
  });
});
