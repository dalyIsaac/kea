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
      // Given
      const contextStub = createKeaContextStub();

      // When
      const command = createRefreshPullRequestListCommand(contextStub);
      command();

      // Then
      assert.ok((contextStub.pullRequestListTreeProvider.refresh as sinon.SinonStub).calledOnce);
    });
  });

  suite("createRefreshPullRequestContentsCommand", () => {
    test("should call refresh on pullRequestContentsProvider", () => {
      // Given
      const contextStub = createKeaContextStub();

      // When
      const command = createRefreshPullRequestContentsCommand(contextStub);
      command();

      // Then
      assert.ok((contextStub.pullRequestContentsProvider.refresh as sinon.SinonStub).calledOnce);
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
