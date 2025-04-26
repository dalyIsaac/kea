import * as vscode from "vscode";
import { KeaContext } from "./core/context";
import { Logger } from "./core/logger";
import { CommentsRootDecorationProvider } from "./decorations/comments-root-decoration-provider";
import { FileCommentDecorationProvider } from "./decorations/file-comment-decoration-provider";

let ctx: KeaContext;

export function activate(extCtx: vscode.ExtensionContext) {
  Logger.info("Kea extension activated");

  ctx = new KeaContext(extCtx);

  ctx.treeDecorationManager.registerProviders(
    new FileCommentDecorationProvider(),
    new CommentsRootDecorationProvider(ctx.repositoryManager),
  );
}

export async function deactivate() {
  await ctx.dispose();
  Logger.info("Kea extension deactivated");
}
