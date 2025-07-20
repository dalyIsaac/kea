import * as vscode from "vscode";
import { CollapsibleState, getCollapsibleState, IParentTreeNode, ITreeNode } from "../tree-node";

/**
 * Base class for folder tree nodes with common functionality.
 */
export abstract class BaseFolderTreeNode<TChild extends ITreeNode> implements IParentTreeNode<TChild> {
  #contextValue: string;
  #tooltip = "Folder";

  folderName: string;
  collapsibleState: CollapsibleState = "collapsed";
  children: TChild[];

  protected constructor(folderPath: string, contextValue: string) {
    this.folderName = folderPath.split("/").pop() ?? folderPath;
    this.#contextValue = contextValue;
    this.children = [];
  }

  abstract getTreeItem(): vscode.TreeItem;

  getChildren = (): TChild[] => this.children;

  protected createBaseTreeItem(): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(this.folderName, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.tooltip = this.#tooltip;
    return treeItem;
  }
}