import * as vscode from "vscode";

export interface ITreeNode {
  /**
   * The context value of the tree item - see {@link vscode.TreeItem.contextValue}.
   */
  contextValue: string;

  /**
   * The collapsible state of the tree item. This maps to the {@link vscode.TreeItemCollapsibleState} enum.
   */
  collapsibleState: "none" | "collapsed" | "expanded";

  /**
   * The description of the tree item. This is shown in the tree view.
   * This maps to the {@link vscode.TreeItem.description} property.
   */
  description: string;

  /**
   * Gets the tree item to render for this node.
   * @returns The tree item to render.
   */
  getTreeItem: () => vscode.TreeItem | Thenable<vscode.TreeItem>;
}

export interface IParentTreeNode<T extends ITreeNode> extends ITreeNode {
  /**
   * Get the child tree items of this node.
   * This is used to populate the tree view with child items.
   */
  getChildren: () => Promise<T[]> | T[];
}
