import * as vscode from "vscode";

export abstract class TreeDecorationProvider implements vscode.FileDecorationProvider {
  #onDidChangeFileDecoration: vscode.EventEmitter<vscode.Uri | vscode.Uri[]> = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> = this.#onDidChangeFileDecoration.event;

  abstract provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration>;
}
