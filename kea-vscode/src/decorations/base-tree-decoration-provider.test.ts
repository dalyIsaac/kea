import * as assert from "assert";
import * as vscode from "vscode";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";

class TestTreeDecorationProvider extends BaseTreeDecorationProvider {
  provideFileDecoration(_uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
    return undefined;
  }
}

suite("BaseTreeDecorationProvider", () => {
  test("onDidChangeFileDecorations fires when refresh is called", () => {
    // Given
    const provider = new TestTreeDecorationProvider();
    const uri = vscode.Uri.parse("file:///test.txt");

    let eventFired = false;
    provider.onDidChangeFileDecorations((changedUri) => {
      if (Array.isArray(changedUri)) {
        eventFired = changedUri.includes(uri);
      } else {
        eventFired = changedUri === uri;
      }
    });

    // When
    provider.refresh(uri);

    // Then
    assert.strictEqual(eventFired, true, "The event should have been fired with the correct URI.");
  });
});
