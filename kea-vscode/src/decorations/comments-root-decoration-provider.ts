import * as vscode from "vscode";
import { Logger } from "../core/logger";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { DECORATION_SCHEMES, parseDecorationPayload } from "./decoration-schemes";

export class CommentsRootDecorationProvider extends BaseTreeDecorationProvider {
  override provideFileDecoration = (uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> => {
    const payload = parseDecorationPayload(uri);
    if (payload instanceof Error) {
      Logger.error("Failed to parse decoration payload", payload);
      return null;
    }

    if (payload.type !== DECORATION_SCHEMES.commentsRoot) {
      return null;
    }

    const { commentCount } = payload.payload;

    if (commentCount === undefined) {
      return null;
    }

    return {
      badge: commentCount > 9 ? "9+" : `${commentCount}`,
      tooltip: `Comments (${commentCount})`,
    };
  };
}
