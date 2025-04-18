import * as vscode from "vscode";
import { CollapsibleState, getCollapsibleState, ITreeNode } from "../tree-node";

/**
 * Provides information about a file or directory in a commit.
 */
export class CommitFileTreeNode implements ITreeNode {
  #contextValue = "commitFile";
  #iconPath = new vscode.ThemeIcon("file-code");

  filePath: string;
  isDirectory: boolean;

  collapsibleState: CollapsibleState;

  constructor(filePath: string) {
    const isDirectory = filePath.endsWith("/");

    this.collapsibleState = isDirectory ? "collapsed" : "none";
    this.filePath = filePath;
    this.isDirectory = isDirectory;
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.filePath, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;

    return treeItem;
  };
}
