import * as vscode from "vscode";

/**
 * Provides information about a file or directory in a commit.
 */
export class CommitFileTreeItem extends vscode.TreeItem {
  override contextValue = "commitFile";
  override iconPath = new vscode.ThemeIcon("file-code");

  filePath: string;
  isDirectory: boolean;

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
