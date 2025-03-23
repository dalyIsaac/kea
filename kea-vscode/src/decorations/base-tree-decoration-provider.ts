import * as vscode from "vscode";

export abstract class BaseTreeDecorationProvider<T> implements vscode.FileDecorationProvider {
  #onDidChangeFileDecoration: vscode.EventEmitter<vscode.Uri | vscode.Uri[]> = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> = this.#onDidChangeFileDecoration.event;

  abstract provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration>;
  abstract getDecorationUri(payload: T): vscode.Uri | undefined;

  refresh = (uri: vscode.Uri): void => {
    this.#onDidChangeFileDecoration.fire(uri);
  };
}
