import * as vscode from "vscode";
import { IKeaRepository } from "../../repository/kea-repository";
import { Commit } from "../../types/kea";
import { CollapsibleState, getCollapsibleState } from "../tree-node";
import { BaseFilesRootTreeNode, FilesRootTreeNodeChild } from "./base-files-root-tree-node";

/**
 * Provides information about a file or directory in a commit.
 */
export class CommitTreeNode extends BaseFilesRootTreeNode {
  #contextValue = "commit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  commit: Commit;

  collapsibleState: CollapsibleState = "collapsed";

  constructor(repository: IKeaRepository, commit: Commit) {
    super(repository);
    this.commit = commit;
  }

  getTreeItem = (): vscode.TreeItem => {
    const commitTitle = this.commit.commit.message.split("\n")[0] ?? "<Empty commit>";
    const treeItem = new vscode.TreeItem(commitTitle, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.commit.commit.message;
    return treeItem;
  };

  getChildren = async (): Promise<FilesRootTreeNodeChild[]> => {
    const files = await this._repository.getCommitFiles(this.commit.sha);

    if (files instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching commit files: ${files.message}`);
      return [];
    }

    return this._toTree(files, []);
  };
}
