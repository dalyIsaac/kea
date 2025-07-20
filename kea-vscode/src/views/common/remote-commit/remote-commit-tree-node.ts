import * as vscode from "vscode";
import { IKeaRepository } from "../../../repository/kea-repository";
import { Commit, CommitFile, FileComment } from "../../../types/kea";
import { BaseFileTreeNode } from "../../common/base-file-tree-node";
import { BaseFilesRootTreeNode, FilesRootTreeNodeChild } from "../../common/base-files-root-tree-node";
import { BaseFolderTreeNode } from "../../common/base-folder-tree-node";
import { CollapsibleState, getCollapsibleState } from "../../tree-node";
import { RemoteFileTreeNode } from "./remote-file-tree-node";
import { RemoteFolderTreeNode } from "./remote-folder-tree-node";

/**
 * Provides information about a file or directory in a commit.
 */
export class RemoteCommitTreeNode extends BaseFilesRootTreeNode {
  #contextValue = "commit";
  #iconPath = new vscode.ThemeIcon("cloud");
  commit: Commit;

  collapsibleState: CollapsibleState = "collapsed";

  constructor(repository: IKeaRepository, commit: Commit) {
    super(repository);
    this.commit = commit;
  }

  protected createFileNode(file: CommitFile, comments: FileComment[]): BaseFileTreeNode {
    return new RemoteFileTreeNode(this._repository.account.accountKey, this._repository.repoId, file, comments);
  }

  protected createFolderNode(folderPath: string): BaseFolderTreeNode<FilesRootTreeNodeChild> {
    return new RemoteFolderTreeNode(folderPath) as BaseFolderTreeNode<FilesRootTreeNodeChild>;
  }

  getTreeItem = (): vscode.TreeItem => {
    let commitTitle = this.commit.commit.message.split("\n")[0];

    // Handle empty string explicitly.
    if (commitTitle === "") {
      commitTitle = "<Empty commit>";
    }
    commitTitle = commitTitle ?? "<Empty commit>";

    const treeItem = new vscode.TreeItem(commitTitle, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.commit.commit.message;
    return treeItem;
  };

  getChildren = async (): Promise<FilesRootTreeNodeChild[]> => {
    const [files, comments] = await Promise.all([
      this._repository.getCommitFiles(this.commit.sha),
      this._repository.getCommitComments(this.commit.sha),
    ]);

    if (files instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching commit files: ${files.message}`);
      return [];
    }

    if (comments instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching commit comments: ${comments.message}`);

      return this._toTree(files, []);
    }

    return this._toTree(files, comments);
  };
}
