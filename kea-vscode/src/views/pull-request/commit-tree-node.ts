import * as vscode from "vscode";
import { PullRequestCommit } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, ITreeNode } from "../tree-node";

/**
 * Provides information about a file or directory in a commit.
 */
export class CommitTreeNode implements ITreeNode {
  #contextValue = "commit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  #comment: PullRequestCommit;

  collapsibleState: CollapsibleState;

  constructor(commit: PullRequestCommit) {
    this.#comment = commit;
    this.collapsibleState = commit.files && commit.files.length > 0 ? "collapsed" : "none";
  }

  getTreeItem = (): vscode.TreeItem => {
    const commitTitle = this.#comment.commit.message.split("\n")[0] ?? "<Empty commit>";
    const treeItem = new vscode.TreeItem(commitTitle, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#comment.commit.message;
    return treeItem;
  };
}
