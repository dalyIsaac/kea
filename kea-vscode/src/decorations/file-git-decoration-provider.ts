import * as vscode from "vscode";
import { Logger } from "../core/logger";
import { BaseTreeDecorationProvider } from "./base-tree-decoration-provider";
import { DECORATION_SCHEMES, parseDecorationPayload } from "./decoration-schemes";

export class FileGitDecorationProvider extends BaseTreeDecorationProvider {
  override provideFileDecoration = (uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> => {
    // Only handle known decoration schemes, silently ignore others
    const knownSchemes: string[] = Object.values(DECORATION_SCHEMES);
    if (!knownSchemes.includes(uri.scheme)) {
      return null;
    }

    const payload = parseDecorationPayload(uri);
    if (payload instanceof Error) {
      Logger.error("Failed to parse decoration payload", payload);
      return null;
    }

    if (payload.type !== DECORATION_SCHEMES.localFiles && payload.type !== DECORATION_SCHEMES.remoteFiles) {
      return null;
    }

    const { fileStatus } = payload.payload;

    let color: vscode.ThemeColor | undefined;

    switch (fileStatus) {
      case "A":
        color = new vscode.ThemeColor("gitDecoration.addedResourceForeground");
        break;
      case "M":
        color = new vscode.ThemeColor("gitDecoration.modifiedResourceForeground");
        break;
      case "D":
        color = new vscode.ThemeColor("gitDecoration.deletedResourceForeground");
        break;
      case "R":
        color = new vscode.ThemeColor("gitDecoration.renamedResourceForeground");
        break;
      case "C":
        color = new vscode.ThemeColor("gitDecoration.copiedResourceForeground");
        break;
      case "U":
        color = new vscode.ThemeColor("gitDecoration.untrackedResourceForeground");
        break;
      case "T":
        color = new vscode.ThemeColor("gitDecoration.ignoredResourceForeground");
        break;
      case " ":
        color = new vscode.ThemeColor("gitDecoration.unmodifiedResourceForeground");
        break;
    }

    return {
      badge: fileStatus,
      color,
    };
  };
}
