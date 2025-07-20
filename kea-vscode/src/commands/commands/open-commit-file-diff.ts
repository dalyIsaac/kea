import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { ApiCache } from "../../cache/api/api-cache";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { DECORATION_SCHEMES, parseDecorationPayload } from "../../decorations/decoration-schemes";
import { ILocalGitRepository, LocalGitRepository } from "../../git/local-git-repository";

export interface IOpenCommitFileDiffCommandArgs {
  resourceUri?: vscode.Uri;
  commitSha?: string;
  filePath?: string;
  workspacePath?: string;
  localGitRepo?: ILocalGitRepository;
}

export const createOpenCommitFileDiffCommand =
  (ctx: IKeaContext) =>
  async (args?: IOpenCommitFileDiffCommandArgs): Promise<Error | void> => {
    // Handle new local commit format.
    if (args?.commitSha && args.filePath && args.workspacePath) {
      await handleLocalCommitFileDiff(args.commitSha, args.filePath, args.workspacePath);
      return;
    }

    // Handle legacy resource URI format.
    if (!args?.resourceUri) {
      Logger.error("No resource URI or commit info provided for file diff command");
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

      await handleLocalCommitFileDiff(currentCommit, filePath, workspaceFolder.uri.fsPath);
      return;
    } catch (error) {
      Logger.error("Error opening commit file diff", error);
      vscode.window.showErrorMessage("Failed to open file diff");
    }
  };

async function handleLocalCommitFileDiff(commitSha: string, filePath: string, workspacePath: string): Promise<void> {
  try {
    // Create a LocalGitRepository instance.
    const localGitRepo = new LocalGitRepository(workspacePath, new ApiCache(100));

    // Get the parent commit to show what changed in this commit.
    const parentCommit = await localGitRepo.getParentCommit(commitSha);

    let leftContent: string;
    let leftTitle: string;

    if (parentCommit instanceof Error) {
      // This might be the first commit, show empty content.
      leftContent = "";
      leftTitle = "Initial";
    } else {
      // Get file content at parent commit.
      const parentContent = await localGitRepo.getFileAtCommit(parentCommit, filePath);
      if (parentContent instanceof Error) {
        // File didn't exist in parent commit, show empty content.
        leftContent = "";
        leftTitle = "New file";
      } else {
        leftContent = parentContent;
        leftTitle = parentCommit.substring(0, 7);
      }
    }

    // Get file content at the commit we're viewing.
    const commitContent = await localGitRepo.getFileAtCommit(commitSha, filePath);

    if (commitContent instanceof Error) {
      Logger.error(`Failed to get commit content for ${filePath} at ${commitSha}`, commitContent);
      vscode.window.showErrorMessage(`Failed to read file at commit ${commitSha}: ${commitContent.message}`);
      return;
    }

    // Create temporary files with proper extensions for syntax highlighting.
    const tempDir = path.join(os.tmpdir(), "kea-commit-files");

    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch {
      // Directory might already exist, ignore error.
    }

    const fileExtension = path.extname(filePath);
    const baseName = path.basename(filePath, fileExtension);

    const leftTempFileName = `${baseName}.${leftTitle}${fileExtension}`;
    const rightTempFileName = `${baseName}.${commitSha.substring(0, 7)}${fileExtension}`;

    const leftTempFilePath = path.join(tempDir, leftTempFileName);
    const rightTempFilePath = path.join(tempDir, rightTempFileName);

    await fs.writeFile(leftTempFilePath, leftContent, "utf8");
    await fs.writeFile(rightTempFilePath, commitContent, "utf8");

    const leftTempFileUri = vscode.Uri.file(leftTempFilePath);
    const rightTempFileUri = vscode.Uri.file(rightTempFilePath);

    // Open diff editor with parent commit on the left and current commit on the right.
    // Show the full file path in the title to indicate which file is being diffed.
    await vscode.commands.executeCommand(
      "vscode.diff",
      leftTempFileUri,
      rightTempFileUri,
      `${filePath} (${leftTitle} ↔ ${commitSha.substring(0, 7)})`,
      {
        preview: true,
      },
    );

    // Schedule cleanup of temporary files after a delay.
    setTimeout(() => {
      void (async () => {
        try {
          await fs.unlink(leftTempFilePath);
          await fs.unlink(rightTempFilePath);
        } catch {
          // Ignore cleanup errors.
        }
      })();
    }, 30000); // Clean up after 30 seconds.
  } catch (error) {
    Logger.error("Error opening local commit file diff", error);
    vscode.window.showErrorMessage("Failed to open file diff");
  }
}
