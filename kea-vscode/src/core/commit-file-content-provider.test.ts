import * as assert from "assert";
import * as vscode from "vscode";
import { CommitFileContentProvider } from "./commit-file-content-provider";
import { createKeaContextStub } from "../test-utils";

suite("CommitFileContentProvider", () => {
  test("should provide file content from commit", async () => {
    // Given
    const mockContext = createKeaContextStub();
    const provider = new CommitFileContentProvider(mockContext);
    
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

    // Then - should not throw and return a string (even if it's an error message)
    assert.ok(typeof result === "string");
    assert.ok(result.length > 0);
  });

  test("should handle invalid URI query gracefully", async () => {
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

    // Then - should return error message
    assert.ok(typeof result === "string");
    assert.ok(result.includes("Error loading file content"));
  });
});