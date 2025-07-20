import * as vscode from "vscode";
import { BaseFolderTreeNode } from "./base-folder-tree-node";
import { RemoteFileTreeNode } from "./remote-file-tree-node";

/**
 * Tree item representing a remote folder.
 */
export class RemoteFolderTreeNode extends BaseFolderTreeNode<RemoteFileTreeNode | RemoteFolderTreeNode> {
  constructor(folderPath: string) {
    super(folderPath, "folder");
  }

  getTreeItem = (): vscode.TreeItem => {
    return this.createBaseTreeItem();
  };
}

// Maintain backward compatibility
export const FolderTreeNode = RemoteFolderTreeNode;
export type FolderTreeNodeType = RemoteFolderTreeNode;
