import * as vscode from "vscode";
import { Logger } from "../core/logger";
import { DECORATION_SCHEMES, parseDecorationPayload } from "./decoration-schemes";
import { TreeDecorationProvider } from "./tree-decoration-provider";

export class CommentDecorationProvider extends TreeDecorationProvider {
  override provideFileDecoration = (uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> => {
    const payload = parseDecorationPayload(uri);
    if (payload instanceof Error) {
      Logger.error("Failed to parse decoration payload", payload);
      return null;
    }

    if (payload.type !== DECORATION_SCHEMES.files) {
      return null;
    }

    const { repoId, filePath } = payload.payload;

    // TODO: Add the count of comments
    return {
      badge: "DA",
      color: new vscode.ThemeColor("gitDecoration.addedResourceForeground"),
    };
  };
}
