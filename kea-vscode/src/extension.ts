import * as vscode from "vscode";
import { CommandManager } from "./commands/command-manager";
import { KeaContext } from "./core/context";
import { Logger } from "./core/logger";
import { CommentsRootDecorationProvider } from "./decorations/comments-root-decoration-provider";
import { FileCommentDecorationProvider } from "./decorations/file-comment-decoration-provider";

export function activate(_context: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  const ctx = new KeaContext();

  ctx.treeDecorationManager.registerProviders(
    new FileCommentDecorationProvider(),
    new CommentsRootDecorationProvider(ctx.repositoryManager),
  );

  // Register tree providers.
  vscode.window.registerTreeDataProvider("kea.pullRequestList", ctx.pullRequestListTreeProvider);
  vscode.window.registerTreeDataProvider("kea.pullRequestContents", ctx.pullRequestContentsProvider);

  const _commandManager = new CommandManager(ctx);
}

export function deactivate() {
  Logger.info("Kea extension deactivated");
}
