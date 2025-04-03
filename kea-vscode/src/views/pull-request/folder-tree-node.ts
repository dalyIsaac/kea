import * as vscode from "vscode";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { FileTreeNode } from "./file-tree-node";

/**
 * Tree item representing a folder.
 */
export class FolderTreeNode implements IParentTreeNode<FileTreeNode | FolderTreeNode> {
  #contextValue = "folder";
  #iconPath = new vscode.ThemeIcon("folder");
  #tooltip = "Folder";
  folderName: string;

  collapsibleState: CollapsibleState = "collapsed";

  children: Array<FileTreeNode | FolderTreeNode>;

  constructor(folderPath: string) {
    this.folderName = folderPath.split("/").pop() ?? folderPath;

    this.children = [];
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.folderName, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;
    return treeItem;
  };

  getChildren = (): Array<FileTreeNode | FolderTreeNode> => this.children;
}
