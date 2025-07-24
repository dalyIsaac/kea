import * as path from "path";
import * as vscode from "vscode";
import { IKeaContext } from "./context";
import { Logger } from "./logger";
import { LocalGitRepository } from "../git/local-git-repository";

interface CommitFileQuery {
  commitSha: string;
  filePath: string;
  workspacePath: string;
}

export class CommitFileContentProvider implements vscode.TextDocumentContentProvider {
  #ctx: IKeaContext;

  constructor(ctx: IKeaContext) {
    this.#ctx = ctx;
  }

  async provideTextDocumentContent(uri: vscode.Uri, _token: vscode.CancellationToken): Promise<string> {
    try {
      // Log that the provider is being called
      Logger.debug(`CommitFileContentProvider called for URI: ${uri.toString()}`);
      
      const query = JSON.parse(uri.query) as CommitFileQuery;
      const { commitSha, filePath, workspacePath } = query;

      Logger.debug(`Parsed query - commitSha: ${commitSha}, filePath: ${filePath}, workspacePath: ${workspacePath}`);

      // Validate inputs.
      if (!commitSha || !filePath || !workspacePath) {
        const error = `Missing required parameters: commitSha=${commitSha}, filePath=${filePath}, workspacePath=${workspacePath}`;
        Logger.error(error);
        return "";
      }

      // Get git repository through git manager
      const workspaceFolder: vscode.WorkspaceFolder = {
        uri: vscode.Uri.file(workspacePath),
        name: path.basename(workspacePath),
        index: 0,
      };
      
      const localGitRepo = await this.#ctx.gitManager.getLocalGitRepository(workspaceFolder);
      if (localGitRepo instanceof Error) {
        Logger.error("Failed to get local git repository", localGitRepo);
        return "";
      }
      
      // Handle initial commit case (null SHA).
      if (commitSha === "0000000000000000000000000000000000000000") {
        Logger.debug(`Returning empty content for initial commit state`);
        return "";
      }
      
      // Get file content at the specified commit.
      const fileContent = await localGitRepo.getFileAtCommit(commitSha, filePath);
      
      if (fileContent instanceof Error) {
        Logger.warn(`Failed to get file content for ${filePath} at commit ${commitSha}`, fileContent);
        return "";
      }

      Logger.debug(`Successfully retrieved ${fileContent.length} characters for ${filePath} at commit ${commitSha}`);
      return fileContent;
    } catch (error) {
      Logger.error("Error providing commit file content", error);
      return "";
    }
  }
}