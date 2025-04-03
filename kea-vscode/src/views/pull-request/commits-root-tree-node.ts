import * as vscode from "vscode";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { CommitFileTreeNode } from "./commit-file-tree-node";

/**
 * Provides information about the commits in the current pull request.
 */
export class CommitsRootTreeNode implements IParentTreeNode<CommitFileTreeNode> {
  #contextValue = "commit";
  #iconPath = new vscode.ThemeIcon("git-commit");

  collapsibleState: CollapsibleState = "collapsed";

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem("Commits", getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    return treeItem;
  };

  getChildren = (): CommitFileTreeNode[] => {
    return [];
  };
}
