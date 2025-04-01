import * as vscode from "vscode";

export type CollapsibleState = "none" | "collapsed" | "expanded";

export interface ITreeNode {
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
  getChildren: () => T[] | Thenable<T[]>;
}

export const getCollapsibleState = (state: "none" | "collapsed" | "expanded"): vscode.TreeItemCollapsibleState => {
  switch (state) {
    case "none":
      return vscode.TreeItemCollapsibleState.None;
    case "collapsed":
      return vscode.TreeItemCollapsibleState.Collapsed;
    case "expanded":
      return vscode.TreeItemCollapsibleState.Expanded;
  }
};

export const isParentTreeNode = <T extends ITreeNode>(node: ITreeNode): node is IParentTreeNode<T> =>
  "getChildren" in node && typeof node.getChildren === "function";
