import * as vscode from "vscode";
import { Logger } from "../core/logger";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { DECORATION_SCHEMES, parseDecorationPayload } from "./decoration-schemes";

export class FileCommentDecorationProvider extends BaseTreeDecorationProvider {
  override provideFileDecoration = (uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> => {
    const payload = parseDecorationPayload(uri);
    if (payload instanceof Error) {
      Logger.error("Failed to parse decoration payload", payload);
      return null;
    }

    if (payload.type !== DECORATION_SCHEMES.files) {
      return null;
    }

    const { fileStatus, commentCount } = payload.payload;

    let color: vscode.ThemeColor | undefined;
    let statusChar: string | undefined;

    switch (fileStatus) {
      case "added":
        color = new vscode.ThemeColor("gitDecoration.addedResourceForeground");
        statusChar = "A";
        break;
      case "modified":
        color = new vscode.ThemeColor("gitDecoration.modifiedResourceForeground");
        statusChar = "M";
        break;
      case "removed":
        color = new vscode.ThemeColor("gitDecoration.deletedResourceForeground");
        statusChar = "D";
        break;
      case "renamed":
        color = new vscode.ThemeColor("gitDecoration.renamedResourceForeground");
        statusChar = "R";
        break;
      case "copied":
        color = new vscode.ThemeColor("gitDecoration.copiedResourceForeground");
        statusChar = "C";
        break;
      case "changed":
        color = new vscode.ThemeColor("gitDecoration.changedResourceForeground");
        statusChar = "C";
        break;
      case "unchanged":
        color = new vscode.ThemeColor("gitDecoration.untrackedResourceForeground");
        statusChar = "U";
        break;
    }

    // There is a two-character limit for the badge, enforced by vscode.
    let badge: string;
    if (commentCount > 9) {
      badge = "9+";
    } else if (commentCount > 0) {
      badge = `${commentCount}`;
    } else {
      badge = statusChar;
    }

    return {
      badge,
      color,
    };
  };
}
