import * as vscode from "vscode";
import { BaseFolderTreeNode } from "../base-folder-tree-node";
import { LocalFileTreeNode } from "./local-file-tree-node";

/**
 * Represents a folder in a local commit tree.
 */
export class LocalFolderTreeNode extends BaseFolderTreeNode<LocalFileTreeNode | LocalFolderTreeNode> {
  constructor(folderPath: string) {
    super(folderPath, "localFolder");
  }

  getTreeItem = (): vscode.TreeItem => {
    return this.createBaseTreeItem();
  };
}
