import * as vscode from "vscode";
import * as path from "path";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { parseDecorationPayload, DECORATION_SCHEMES } from "../../decorations/decoration-schemes";

export interface IOpenCommitFileDiffCommandArgs {
  resourceUri: vscode.Uri;
}

export const createOpenCommitFileDiffCommand =
  (ctx: IKeaContext) =>
  async (args?: IOpenCommitFileDiffCommandArgs): Promise<Error | void> => {
    if (!args?.resourceUri) {
      Logger.error("No resource URI provided for file diff command");
      return;
    }

    const payload = parseDecorationPayload(args.resourceUri);
    if (payload instanceof Error) {
      Logger.error("Failed to parse decoration payload", payload);
      return;
    }

    if (payload.type !== DECORATION_SCHEMES.files) {
      Logger.error("Invalid decoration scheme for file diff command");
      return;
    }

    const { filePath } = payload.payload;

    try {
      // Get workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder found");
        return;
      }

      const workspaceFolder = workspaceFolders[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder found");
        return;
      }
      
      // Get local git repository
      const localGitRepo = await ctx.gitManager.getLocalGitRepository(workspaceFolder);
      if (localGitRepo instanceof Error) {
        Logger.error("Failed to get local git repository", localGitRepo);
        vscode.window.showErrorMessage("Failed to access local git repository");
        return;
      }

      // Get current HEAD commit
      const currentCommit = await localGitRepo.getCurrentCommit();
      if (currentCommit instanceof Error) {
        Logger.error("Failed to get current commit", currentCommit);
        vscode.window.showErrorMessage("Failed to get current commit");
        return;
      }

      // Create URIs for diff
      const workspaceFilePath = path.join(workspaceFolder.uri.fsPath, filePath);
      const workspaceFileUri = vscode.Uri.file(workspaceFilePath);
      
      // Create a virtual URI for the commit version of the file
      const commitFileUri = vscode.Uri.from({
        scheme: "kea-commit-file",
        path: filePath,
        query: JSON.stringify({
          commitSha: currentCommit,
          filePath: filePath,
          workspacePath: workspaceFolder.uri.fsPath,
        }),
      });

      // Check if workspace file exists
      let rightUri = workspaceFileUri;
      try {
        await vscode.workspace.fs.stat(workspaceFileUri);
      } catch {
        // File doesn't exist in working tree, show empty file
        rightUri = vscode.Uri.from({
          scheme: "untitled",
          path: filePath,
        });
      }

      // Open diff editor
      await vscode.commands.executeCommand(
        "vscode.diff",
        commitFileUri,
        rightUri,
        `${path.basename(filePath)} (HEAD ↔ Working Tree)`,
        {
          preview: true,
        }
      );
    } catch (error) {
      Logger.error("Error opening commit file diff", error);
      vscode.window.showErrorMessage("Failed to open file diff");
    }
  };