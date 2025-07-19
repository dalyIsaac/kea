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
      const query = JSON.parse(uri.query) as CommitFileQuery;
      const { commitSha, filePath, workspacePath } = query;

      // Create a local git repository instance
      const localGitRepo = new LocalGitRepository(workspacePath, this.#ctx.apiCache);
      
      // Get file content at the specified commit
      const fileContent = await localGitRepo.getFileAtCommit(commitSha, filePath);
      
      if (fileContent instanceof Error) {
        Logger.warn(`Failed to get file content for ${filePath} at commit ${commitSha}`, fileContent);
        return `// Failed to load file content: ${fileContent.message}`;
      }

      return fileContent;
    } catch (error) {
      Logger.error("Error providing commit file content", error);
      return `// Error loading file content: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }
}