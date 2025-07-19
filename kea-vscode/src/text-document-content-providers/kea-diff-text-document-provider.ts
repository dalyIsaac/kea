import * as vscode from "vscode";
import { IKeaContext } from "../core/context";
import { Logger } from "../core/logger";

const keaDiffScheme = "kea-diff";

export class KeaDiffTextDocumentProvider implements vscode.TextDocumentContentProvider {
  #ctx: IKeaContext;

  constructor(ctx: IKeaContext) {
    this.#ctx = ctx;
  }

  onDidChange?: vscode.Event<vscode.Uri>;
  provideTextDocumentContent = async (uri: vscode.Uri, token: vscode.CancellationToken): Promise<string | null | undefined> => {
    const parsedUri = KeaDiffTextDocumentProvider.parseKeaDiffUri(uri);
    if (parsedUri instanceof Error) {
      Logger.error(parsedUri);
      return;
    }

    const fileUri = vscode.Uri.parse(parsedUri.path);

    const fileContent = await vscode.workspace.fs.readFile(fileUri);
    return fileContent.toString();
  };

  static get scheme(): string {
    return keaDiffScheme;
  }

  static createKeaDiffUri = (uri: vscode.Uri): vscode.Uri => {
    return vscode.Uri.parse(`${keaDiffScheme}://${uri.path}`);
  };

  static parseKeaDiffUri = (uri: vscode.Uri): vscode.Uri | Error => {
    if (uri.scheme !== keaDiffScheme) {
      return new Error(`Invalid URI scheme: ${uri.scheme}. Expected: ${keaDiffScheme}`);
    }
    return vscode.Uri.parse(uri.path);
  };
}
