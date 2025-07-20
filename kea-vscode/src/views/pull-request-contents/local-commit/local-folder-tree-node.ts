import * as vscode from "vscode";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../../tree-node";
import { LocalFileTreeNode } from "./local-file-tree-node";

/**
 * Represents a folder in a local commit tree.
 */
export class LocalFolderTreeNode implements IParentTreeNode<LocalFileTreeNode | LocalFolderTreeNode> {
  #contextValue = "localFolder";
  #iconPath = new vscode.ThemeIcon("folder");
  #tooltip = "Folder";
  folderName: string;

  collapsibleState: CollapsibleState = "collapsed";
  children: Array<LocalFileTreeNode | LocalFolderTreeNode>;

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

  getChildren = (): Array<LocalFileTreeNode | LocalFolderTreeNode> => this.children;
}