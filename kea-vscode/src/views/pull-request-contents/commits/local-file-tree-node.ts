import * as path from "path";
import * as vscode from "vscode";
import { IKeaContext } from "../../../core/context";
import { ILocalGitRepository, LocalCommit } from "../../../git/local-git-repository";

/**
 * Represents a file in a local commit tree.
 */
export class LocalFileTreeNode {
  #contextValue = "localFile";
  #localGitRepo: ILocalGitRepository;
  #commit: LocalCommit;
  #workspaceFolder: vscode.WorkspaceFolder;
  #ctx: IKeaContext;
  
  fileName: string;
  filePath: string;
  status: string;
  
  constructor(localGitRepo: ILocalGitRepository, commit: LocalCommit, workspaceFolder: vscode.WorkspaceFolder, filePath: string, status: string, ctx: IKeaContext) {
    this.#localGitRepo = localGitRepo;
    this.#commit = commit;
    this.#workspaceFolder = workspaceFolder;
    this.#ctx = ctx;
    this.filePath = filePath;
    this.status = status;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.fileName = filePath.split("/").pop()!;
  }
  
  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.fileName, vscode.TreeItemCollapsibleState.None);
    treeItem.contextValue = this.#contextValue;
    
    // Let VS Code handle the file icon based on the file extension by setting resourceUri.
    const repoFilePath = path.join(this.#workspaceFolder.uri.fsPath, this.filePath);
    treeItem.resourceUri = vscode.Uri.file(repoFilePath);
    
    treeItem.tooltip = `${this.filePath} (${this.status})`;
    
    // Use command manager to create typed command.
    treeItem.command = this.#ctx.commandManager.getCommand(
      "kea.openCommitFileDiff",
      "Open File Diff",
      {
        commitSha: this.#commit.sha,
        filePath: this.filePath,
        workspacePath: this.#workspaceFolder.uri.fsPath,
        localGitRepo: this.#localGitRepo,
      }
    );
    
    // Show status in description.
    treeItem.description = this.status;
    
    return treeItem;
  };
}