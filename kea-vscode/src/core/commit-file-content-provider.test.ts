import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { CommitFileContentProvider } from "./commit-file-content-provider";
import { createKeaContextStub } from "../test-utils";
import { LocalGitRepository } from "../git/local-git-repository";

suite("CommitFileContentProvider", () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should provide file content from commit", async () => {
    // Given
    const mockContext = createKeaContextStub();
    const provider = new CommitFileContentProvider(mockContext);
    
    // Mock LocalGitRepository.
    const mockGetFileAtCommit = sandbox.stub(LocalGitRepository.prototype, "getFileAtCommit").resolves("file content from commit");
    
    const uri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: "test.txt",
      query: JSON.stringify({
        commitSha: "abc123",
        filePath: "test.txt",
        workspacePath: "/mock/workspace",
      }),
    });

    // When
    const result = await provider.provideTextDocumentContent(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(result, "file content from commit");
    sinon.assert.calledOnceWithExactly(mockGetFileAtCommit, "abc123", "test.txt");
  });

  test("should return empty string when git operation fails", async () => {
    // Given
    const mockContext = createKeaContextStub();
    const provider = new CommitFileContentProvider(mockContext);
    
    // Mock LocalGitRepository to return error.
    sandbox.stub(LocalGitRepository.prototype, "getFileAtCommit").resolves(new Error("Git error"));
    
    const uri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: "test.txt",
      query: JSON.stringify({
        commitSha: "abc123",
        filePath: "test.txt",
        workspacePath: "/mock/workspace",
      }),
    });

    // When
    const result = await provider.provideTextDocumentContent(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(result, "");
  });

  test("should return empty string for missing required parameters", async () => {
    // Given
    const mockContext = createKeaContextStub();
    const provider = new CommitFileContentProvider(mockContext);
    
    const uri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: "test.txt",
      query: JSON.stringify({
        commitSha: "abc123",
        // filePath is missing
        workspacePath: "/mock/workspace",
      }),
    });

    // When
    const result = await provider.provideTextDocumentContent(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(result, "");
  });

  test("should return empty string for invalid URI query", async () => {
    // Given
    const mockContext = createKeaContextStub();
    const provider = new CommitFileContentProvider(mockContext);
    
    const uri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: "test.txt",
      query: "invalid-json",
    });

    // When
    const result = await provider.provideTextDocumentContent(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(result, "");
  });

  test("should return empty string when commitSha is empty", async () => {
    // Given
    const mockContext = createKeaContextStub();
    const provider = new CommitFileContentProvider(mockContext);
    
    const uri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: "test.txt",
      query: JSON.stringify({
        commitSha: "",
        filePath: "test.txt",
        workspacePath: "/mock/workspace",
      }),
    });

    // When
    const result = await provider.provideTextDocumentContent(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(result, "");
  });

  test("should pass correct parameters to LocalGitRepository", async () => {
    // Given
    const mockContext = createKeaContextStub();
    const provider = new CommitFileContentProvider(mockContext);
    
    const mockGetFileAtCommit = sandbox.stub(LocalGitRepository.prototype, "getFileAtCommit").resolves("content");
    
    const uri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: "src/components/Button.tsx",
      query: JSON.stringify({
        commitSha: "def456789",
        filePath: "src/components/Button.tsx",
        workspacePath: "/workspace/project",
      }),
    });

    // When
    await provider.provideTextDocumentContent(uri, new vscode.CancellationTokenSource().token);

    // Then
    sinon.assert.calledOnceWithExactly(mockGetFileAtCommit, "def456789", "src/components/Button.tsx");
  });
});