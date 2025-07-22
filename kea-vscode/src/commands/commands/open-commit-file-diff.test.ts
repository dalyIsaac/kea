import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { createKeaContextStub } from "../../test-utils";
import { LocalGitRepository } from "../../git/local-git-repository";
import { createOpenCommitFileDiffCommand, IOpenCommitFileDiffCommandArgs } from "./open-commit-file-diff";

const setupStubs = () => {
  const sandbox = sinon.createSandbox();
  const executeCommandStub = sandbox.stub(vscode.commands, "executeCommand");
  const showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
  const workspaceFoldersStub = sandbox.stub(vscode.workspace, "workspaceFolders").value([
    {
      uri: vscode.Uri.file("/test/workspace"),
      name: "test-workspace",
      index: 0,
    },
  ]);

  return {
    sandbox,
    executeCommandStub,
    showErrorMessageStub,
    workspaceFoldersStub,
  };
};

suite("OpenCommitFileDiffCommand", () => {

  test("should handle local commit format successfully", async () => {
    // Given
    const { sandbox, executeCommandStub } = setupStubs();
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      filePath: "src/test.ts",
      workspacePath: "/test/workspace",
    };

    // Mock LocalGitRepository methods.
    const mockLocalGitRepo = {
      getParentCommit: sandbox.stub().resolves("parent123"),
      getFileAtCommit: sandbox.stub(),
    };
    
    // Setup file content responses.
    mockLocalGitRepo.getFileAtCommit
      .withArgs("parent123", "src/test.ts").resolves("parent content")
      .withArgs("abc123", "src/test.ts").resolves("commit content");

    sandbox.stub(LocalGitRepository.prototype, "getParentCommit").callThrough();
    sandbox.stub(LocalGitRepository.prototype, "getFileAtCommit").callThrough();

    // When
    const result = await command(args);

    // Then
    assert.strictEqual(result, undefined);
    sinon.assert.calledOnce(executeCommandStub);
    assert.strictEqual(executeCommandStub.getCall(0).args[0], "vscode.diff");
  });

  test("should handle missing arguments gracefully", async () => {
    // Given
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);

    // When
    const result = await command();

    // Then
    assert.strictEqual(result, undefined);
    sinon.assert.notCalled(executeCommandStub);
    sinon.assert.notCalled(showErrorMessageStub);
  });

  test("should handle local commit format with missing filePath", async () => {
    // Given
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      workspacePath: "/test/workspace",
      // filePath is missing
    };

    // When
    const result = await command(args);

    // Then
    assert.strictEqual(result, undefined);
    sinon.assert.notCalled(executeCommandStub);
  });

  test("should handle resource URI format when workspace is available", async () => {
    // Given
    const ctx = createKeaContextStub();
    const mockLocalGitRepo = {
      getCurrentCommit: sandbox.stub().resolves("current123"),
      getParentCommit: sandbox.stub().resolves("parent123"),
      getFileAtCommit: sandbox.stub(),
    };
    
    // Setup git manager mock.
    ctx.gitManager.getLocalGitRepository = sandbox.stub().resolves(mockLocalGitRepo);
    
    // Setup file content responses.
    mockLocalGitRepo.getFileAtCommit
      .withArgs("parent123", "test.ts").resolves("parent content")
      .withArgs("current123", "test.ts").resolves("current content");

    const command = createOpenCommitFileDiffCommand(ctx);
    const resourceUri = vscode.Uri.parse("kea://test?payload");
    
    // Mock the payload parsing (this would be a more complex test with actual implementation).
    // const parseDecorationPayloadStub = sandbox.stub().returns({
    //   type: "files",
    //   payload: { filePath: "test.ts" },
    // });
    
    const args: IOpenCommitFileDiffCommandArgs = {
      resourceUri,
    };

    // When
    const result = await command(args);

    // Then
    assert.strictEqual(result, undefined);
  });

  test("should handle error when no workspace folders", async () => {
    // Given
    workspaceFoldersStub.value(null);
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const resourceUri = vscode.Uri.parse("kea://test?payload");
    
    const args: IOpenCommitFileDiffCommandArgs = {
      resourceUri,
    };

    // When
    const result = await command(args);

    // Then
    assert.strictEqual(result, undefined);
    sinon.assert.calledOnce(showErrorMessageStub);
    sinon.assert.calledWith(showErrorMessageStub, "No workspace folder found");
  });

  test("should handle error when git repository is not available", async () => {
    // Given
    const ctx = createKeaContextStub();
    ctx.gitManager.getLocalGitRepository = sandbox.stub().resolves(new Error("Git not available"));
    
    const command = createOpenCommitFileDiffCommand(ctx);
    const resourceUri = vscode.Uri.parse("kea://test?payload");
    
    const args: IOpenCommitFileDiffCommandArgs = {
      resourceUri,
    };

    // When
    const result = await command(args);

    // Then
    assert.strictEqual(result, undefined);
    sinon.assert.calledOnce(showErrorMessageStub);
    sinon.assert.calledWith(showErrorMessageStub, "Failed to access local git repository");
  });

  test("should handle first commit (no parent) gracefully", async () => {
    // Given
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      filePath: "src/test.ts",
      workspacePath: "/test/workspace",
    };

    // Mock LocalGitRepository methods.
    // const mockLocalGitRepo = {
    //   getParentCommit: sandbox.stub().resolves(new Error("No parent commit")),
    //   getFileAtCommit: sandbox.stub().withArgs("abc123", "src/test.ts").resolves("commit content"),
    // };

    sandbox.stub(LocalGitRepository.prototype, "getParentCommit").resolves(new Error("No parent commit"));
    sandbox.stub(LocalGitRepository.prototype, "getFileAtCommit").withArgs("abc123", "src/test.ts").resolves("commit content");

    // When
    const result = await command(args);

    // Then
    assert.strictEqual(result, undefined);
    sinon.assert.calledOnce(executeCommandStub);
    assert.strictEqual(executeCommandStub.getCall(0).args[0], "vscode.diff");
  });

  test("should handle file that didn't exist in parent commit", async () => {
    // Given
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      filePath: "src/new-file.ts",
      workspacePath: "/test/workspace",
    };

    // Mock LocalGitRepository methods.
    const mockLocalGitRepo = {
      getParentCommit: sandbox.stub().resolves("parent123"),
      getFileAtCommit: sandbox.stub(),
    };
    
    // Setup file content responses - file doesn't exist in parent.
    mockLocalGitRepo.getFileAtCommit
      .withArgs("parent123", "src/new-file.ts").resolves(new Error("File not found"))
      .withArgs("abc123", "src/new-file.ts").resolves("new file content");

    sandbox.stub(LocalGitRepository.prototype, "getParentCommit").callThrough();
    sandbox.stub(LocalGitRepository.prototype, "getFileAtCommit").callThrough();

    // When
    const result = await command(args);

    // Then
    assert.strictEqual(result, undefined);
    sinon.assert.calledOnce(executeCommandStub);
    assert.strictEqual(executeCommandStub.getCall(0).args[0], "vscode.diff");
  });

  test("should handle error when getting commit content fails", async () => {
    // Given
    const ctx = createKeaContextStub();
    const command = createOpenCommitFileDiffCommand(ctx);
    const args: IOpenCommitFileDiffCommandArgs = {
      commitSha: "abc123",
      filePath: "src/test.ts",
      workspacePath: "/test/workspace",
    };

    // Mock LocalGitRepository methods.
    // const mockLocalGitRepo = {
    //   getParentCommit: sandbox.stub().resolves("parent123"),
    //   getFileAtCommit: sandbox.stub().withArgs("abc123", "src/test.ts").resolves(new Error("Failed to read file")),
    // };

    sandbox.stub(LocalGitRepository.prototype, "getParentCommit").resolves("parent123");
    sandbox.stub(LocalGitRepository.prototype, "getFileAtCommit").withArgs("abc123", "src/test.ts").resolves(new Error("Failed to read file"));

    // When
    const result = await command(args);

    // Then
    assert.strictEqual(result, undefined);
    sinon.assert.calledOnce(showErrorMessageStub);
    assert.strictEqual(showErrorMessageStub.getCall(0).args[0], "Failed to read file at commit abc123: Failed to read file");
    sinon.assert.notCalled(executeCommandStub);
  });
});