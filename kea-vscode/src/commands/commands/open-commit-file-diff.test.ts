import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { createKeaContextStub } from "../../test-utils";
import { LocalGitRepository } from "../../git/local-git-repository";
import { createOpenCommitFileDiffCommand, IOpenCommitFileDiffCommandArgs } from "./open-commit-file-diff";

const setupStubs = () => {
  const executeCommandStub = sinon.stub(vscode.commands, "executeCommand");
  const showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
  const workspaceFoldersStub = sinon.stub(vscode.workspace, "workspaceFolders").value([
    {
      uri: vscode.Uri.file("/test/workspace"),
      name: "test-workspace",
      index: 0,
    },
  ]);

  return {
    executeCommandStub,
    showErrorMessageStub,
    workspaceFoldersStub,
  };
};

suite("OpenCommitFileDiffCommand", () => {

  test("should handle local commit format successfully", async () => {
    // Given
    const { executeCommandStub } = setupStubs();
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      filePath: "src/test.ts",
      workspacePath: "/test/workspace",
    };

    // Mock LocalGitRepository methods
    const getParentCommitStub = sinon.stub(LocalGitRepository.prototype, "getParentCommit").resolves("parent123");
    const getFileAtCommitStub = sinon.stub(LocalGitRepository.prototype, "getFileAtCommit");
    getFileAtCommitStub.withArgs("parent123", "src/test.ts").resolves("parent content");
    getFileAtCommitStub.withArgs("abc123", "src/test.ts").resolves("commit content");

    try {
      // When
      const result = await command(args);

      // Then
      assert.strictEqual(result, undefined);
      sinon.assert.calledOnce(executeCommandStub);
      assert.strictEqual(executeCommandStub.getCall(0).args[0], "vscode.diff");
    } finally {
      getParentCommitStub.restore();
      getFileAtCommitStub.restore();
      executeCommandStub.restore();
    }
  });

  test("should handle missing arguments gracefully", async () => {
    // Given
    const { executeCommandStub, showErrorMessageStub } = setupStubs();
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);

    try {
      // When
      const result = await command();

      // Then
      assert.strictEqual(result, undefined);
      sinon.assert.notCalled(executeCommandStub);
      sinon.assert.notCalled(showErrorMessageStub);
    } finally {
      executeCommandStub.restore();
      showErrorMessageStub.restore();
    }
  });

  test("should handle local commit format with missing filePath", async () => {
    // Given
    const { executeCommandStub } = setupStubs();
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      workspacePath: "/test/workspace",
      // filePath is missing
    };

    try {
      // When
      const result = await command(args);

      // Then
      assert.strictEqual(result, undefined);
      sinon.assert.notCalled(executeCommandStub);
    } finally {
      executeCommandStub.restore();
    }
  });

  test("should handle error when no workspace folders", async () => {
    // Given
    const { executeCommandStub, showErrorMessageStub, workspaceFoldersStub } = setupStubs();
    workspaceFoldersStub.value(null);
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const resourceUri = vscode.Uri.parse("kea://test?payload");
    
    const args: IOpenCommitFileDiffCommandArgs = {
      resourceUri,
    };

    try {
      // When
      const result = await command(args);

      // Then
      assert.strictEqual(result, undefined);
      sinon.assert.calledOnce(showErrorMessageStub);
      sinon.assert.calledWith(showErrorMessageStub, "No workspace folder found");
    } finally {
      executeCommandStub.restore();
      showErrorMessageStub.restore();
      workspaceFoldersStub.restore();
    }
  });

  test("should handle first commit (no parent) gracefully", async () => {
    // Given
    const { executeCommandStub } = setupStubs();
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      filePath: "src/test.ts",
      workspacePath: "/test/workspace",
    };

    // Mock LocalGitRepository methods
    const getParentCommitStub = sinon.stub(LocalGitRepository.prototype, "getParentCommit").resolves(new Error("No parent commit"));
    const getFileAtCommitStub = sinon.stub(LocalGitRepository.prototype, "getFileAtCommit");
    getFileAtCommitStub.withArgs("abc123", "src/test.ts").resolves("commit content");

    try {
      // When
      const result = await command(args);

      // Then
      assert.strictEqual(result, undefined);
      sinon.assert.calledOnce(executeCommandStub);
      assert.strictEqual(executeCommandStub.getCall(0).args[0], "vscode.diff");
    } finally {
      getParentCommitStub.restore();
      getFileAtCommitStub.restore();
      executeCommandStub.restore();
    }
  });

  test("should handle file that didn't exist in parent commit", async () => {
    // Given
    const { executeCommandStub } = setupStubs();
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      filePath: "src/new-file.ts",
      workspacePath: "/test/workspace",
    };

    // Mock LocalGitRepository methods
    const getParentCommitStub = sinon.stub(LocalGitRepository.prototype, "getParentCommit").resolves("parent123");
    const getFileAtCommitStub = sinon.stub(LocalGitRepository.prototype, "getFileAtCommit");
    getFileAtCommitStub.withArgs("parent123", "src/new-file.ts").resolves(new Error("File not found"));
    getFileAtCommitStub.withArgs("abc123", "src/new-file.ts").resolves("new file content");

    try {
      // When
      const result = await command(args);

      // Then
      assert.strictEqual(result, undefined);
      sinon.assert.calledOnce(executeCommandStub);
      assert.strictEqual(executeCommandStub.getCall(0).args[0], "vscode.diff");
    } finally {
      getParentCommitStub.restore();
      getFileAtCommitStub.restore();
      executeCommandStub.restore();
    }
  });

  test("should handle error when getting commit content fails", async () => {
    // Given
    const { executeCommandStub, showErrorMessageStub } = setupStubs();
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      filePath: "src/test.ts",
      workspacePath: "/test/workspace",
    };

    // Mock LocalGitRepository methods
    const getParentCommitStub = sinon.stub(LocalGitRepository.prototype, "getParentCommit").resolves("parent123");
    const getFileAtCommitStub = sinon.stub(LocalGitRepository.prototype, "getFileAtCommit");
    getFileAtCommitStub.withArgs("abc123", "src/test.ts").resolves(new Error("Failed to read file"));

    try {
      // When
      const result = await command(args);

      // Then
      assert.strictEqual(result, undefined);
      sinon.assert.calledOnce(showErrorMessageStub);
      assert.strictEqual(showErrorMessageStub.getCall(0).args[0], "Failed to read file at commit abc123: Failed to read file");
      sinon.assert.notCalled(executeCommandStub);
    } finally {
      getParentCommitStub.restore();
      getFileAtCommitStub.restore();
      executeCommandStub.restore();
      showErrorMessageStub.restore();
    }
  });
});