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
    if (args?.commitSha && args.filePath && args.workspacePath) {
      await handleLocalCommitFileDiff(args.commitSha, args.filePath, args.workspacePath);
      return;
    }

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

      const localGitRepo = await ctx.gitManager.getLocalGitRepository(workspaceFolder);
      if (localGitRepo instanceof Error) {
        Logger.error("Failed to get local git repository", localGitRepo);
        vscode.window.showErrorMessage("Failed to access local git repository");
        return;
      }

      const currentCommit = await localGitRepo.getCurrentCommit();
      if (currentCommit instanceof Error) {
        Logger.error("Failed to get current commit", currentCommit);
        vscode.window.showErrorMessage("Failed to get current commit");
        return;
      }

      await handleRemoteApiFileDiff(currentCommit, filePath, workspaceFolder.uri.fsPath);
      return;
    } catch (error) {
      Logger.error("Error opening commit file diff", error);
      vscode.window.showErrorMessage("Failed to open file diff");
    }
  };

async function handleLocalCommitFileDiff(commitSha: string, filePath: string, workspacePath: string): Promise<void> {
  try {
    const localGitRepo = new LocalGitRepository(workspacePath, new ApiCache(100));

    const parentCommit = await localGitRepo.getParentCommit(commitSha);

    let leftTitle: string;
    let leftCommitSha: string;

    if (parentCommit instanceof Error) {
      leftTitle = "Initial";
      leftCommitSha = "0000000000000000000000000000000000000000";
    } else {
      leftTitle = parentCommit.substring(0, 7);
      leftCommitSha = parentCommit;
    }

    const repoFilePath = path.join(workspacePath, filePath);
    
    const leftUri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: repoFilePath,
      query: JSON.stringify({
        commitSha: leftCommitSha,
        filePath,
        workspacePath,
      }),
      fragment: leftTitle,
    });

    const rightUri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: repoFilePath,
      query: JSON.stringify({
        commitSha: commitSha,
        filePath,
        workspacePath,
      }),
      fragment: commitSha.substring(0, 7),
    });

    await vscode.commands.executeCommand(
      "vscode.diff",
      leftUri,
      rightUri,
      `${filePath} (${leftTitle} ↔ ${commitSha.substring(0, 7)})`,
      {
        preview: true,
      },
    );
  } catch (error) {
    Logger.error("Error opening local commit file diff", error);
    vscode.window.showErrorMessage("Failed to open file diff");
  }
}

async function handleRemoteApiFileDiff(commitSha: string, filePath: string, workspacePath: string): Promise<void> {
  try {
    const localGitRepo = new LocalGitRepository(workspacePath, new ApiCache(100));

    const parentCommit = await localGitRepo.getParentCommit(commitSha);

    let leftTitle: string;
    let leftCommitSha: string;

    if (parentCommit instanceof Error) {
      leftTitle = "Initial";
      leftCommitSha = "0000000000000000000000000000000000000000";
    } else {
      leftTitle = parentCommit.substring(0, 7);
      leftCommitSha = parentCommit;
    }

    const repoFilePath = path.join(workspacePath, filePath);
    
    const leftUri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: repoFilePath,
      query: JSON.stringify({
        commitSha: leftCommitSha,
        filePath,
        workspacePath,
      }),
      fragment: leftTitle,
    });

    const rightUri = vscode.Uri.from({
      scheme: "kea-commit-file",
      path: repoFilePath,
      query: JSON.stringify({
        commitSha: commitSha,
        filePath,
        workspacePath,
      }),
      fragment: commitSha.substring(0, 7),
    });

    await vscode.commands.executeCommand(
      "vscode.diff",
      leftUri,
      rightUri,
      `${filePath} (${leftTitle} ↔ ${commitSha.substring(0, 7)})`,
      {
        preview: true,
      },
    );
  } catch (error) {
    Logger.error("Error opening remote API file diff", error);
    vscode.window.showErrorMessage("Failed to open file diff");
  }
}
