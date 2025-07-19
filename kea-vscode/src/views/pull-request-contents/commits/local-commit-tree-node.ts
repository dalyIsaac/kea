import * as vscode from "vscode";
import { ILocalGitRepository, LocalCommit } from "../../../git/local-git-repository";
import { CollapsibleState, getCollapsibleState, ITreeNode } from "../../tree-node";

/**
 * Provides information about a local commit from the git repository.
 */
export class LocalCommitTreeNode implements ITreeNode {
  #contextValue = "localCommit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  
  commit: LocalCommit;
  collapsibleState: CollapsibleState = "none";

  constructor(_localGitRepo: ILocalGitRepository, commit: LocalCommit, _workspaceFolder: vscode.WorkspaceFolder) {
    this.commit = commit;
  }

  getTreeItem = (): vscode.TreeItem => {
    let commitTitle = this.commit.message.split("\n")[0];

    // Handle empty string explicitly.
    if (commitTitle === "") {
      commitTitle = "<Empty commit>";
    }
    commitTitle = commitTitle ?? "<Empty commit>";

    const treeItem = new vscode.TreeItem(commitTitle, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = `${this.commit.message}\n\nAuthor: ${this.commit.author}\nDate: ${this.commit.date.toLocaleString()}\nSHA: ${this.commit.sha}`;
    treeItem.description = this.commit.sha.substring(0, 7);
    
    return treeItem;
  };
}