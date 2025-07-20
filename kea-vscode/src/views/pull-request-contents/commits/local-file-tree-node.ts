import * as vscode from "vscode";
import { ILocalGitRepository, LocalCommit } from "../../../git/local-git-repository";

/**
 * Represents a file in a local commit tree.
 */
export class LocalFileTreeNode {
  #contextValue = "localFile";
  #iconPath = new vscode.ThemeIcon("file");
  
  fileName: string;
  filePath: string;
  status: string;
  #localGitRepo: ILocalGitRepository;
  #commit: LocalCommit;
  #workspaceFolder: vscode.WorkspaceFolder;
  
  constructor(localGitRepo: ILocalGitRepository, commit: LocalCommit, workspaceFolder: vscode.WorkspaceFolder, filePath: string, status: string) {
    this.#localGitRepo = localGitRepo;
    this.#commit = commit;
    this.#workspaceFolder = workspaceFolder;
    this.filePath = filePath;
    this.status = status;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.fileName = filePath.split("/").pop()!;
  }
  
  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.fileName, vscode.TreeItemCollapsibleState.None);
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = `${this.filePath} (${this.status})`;
    
    // Add command to open file diff when clicked.
    treeItem.command = {
      command: "kea.openCommitFileDiff",
      title: "Open File Diff",
      arguments: [{
        commitSha: this.#commit.sha,
        filePath: this.filePath,
        workspacePath: this.#workspaceFolder.uri.fsPath,
        localGitRepo: this.#localGitRepo,
      }],
    };
    
    // Show status in description.
    treeItem.description = this.status;
    
    return treeItem;
  };
}