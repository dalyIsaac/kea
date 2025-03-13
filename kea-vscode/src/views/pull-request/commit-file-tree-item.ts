import * as vscode from "vscode";

/**
 * Provides information about a file or directory in a commit.
 */
export class CommitFileTreeItem extends vscode.TreeItem {
  filePath: string;
  isDirectory: boolean;

  contextValue = "commitFile";
  iconPath = new vscode.ThemeIcon("file-code");

  constructor(filePath: string) {
    const isDirectory = filePath.endsWith("/");

    super(filePath, isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    this.filePath = filePath;
    this.isDirectory = isDirectory;

    this.command = {
      command: "gitlens.showFileInRepoView",
      title: "Show File in Repo View",
      arguments: [filePath],
    };
  }
}
