import * as vscode from "vscode";
import { IKeaRepository } from "../../../repository/kea-repository";
import { CommitFile, FileComment, PullRequestId } from "../../../types/kea";
import { BaseFileTreeNode } from "../../common/base-file-tree-node";
import { BaseFilesRootTreeNode, FilesRootTreeNodeChild } from "../../common/base-files-root-tree-node";
import { BaseFolderTreeNode } from "../../common/base-folder-tree-node";
import { RemoteFileTreeNode } from "../../common/remote-commit/remote-file-tree-node";
import { RemoteFolderTreeNode } from "../../common/remote-commit/remote-folder-tree-node";
import { CollapsibleState, getCollapsibleState, ITreeNode } from "../../tree-node";

/**
 * Parent tree item for files.
 */
export class FilesRootTreeNode extends BaseFilesRootTreeNode {
  #contextValue = "file";
  #iconPath = new vscode.ThemeIcon("file-directory");
  #tooltip = "Files";
  #label = "Files";

  pullId: PullRequestId;
  collapsibleState: CollapsibleState = "collapsed";

  constructor(repository: IKeaRepository, id: PullRequestId) {
    super(repository);
    this.pullId = id;
  }

  protected createFileNode(file: CommitFile, comments: FileComment[]): BaseFileTreeNode {
    return new RemoteFileTreeNode(this._repository.account.accountKey, this._repository.repoId, file, comments);
  }

  protected createFolderNode(folderPath: string): BaseFolderTreeNode<any> {
    return new RemoteFolderTreeNode(folderPath);
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.#label, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;
    return treeItem;
  };

  getChildren = async (): Promise<FilesRootTreeNodeChild[]> => {
    const [files, reviewComments] = await Promise.all([
      this._repository.getPullRequestFiles(this.pullId),
      this._repository.getPullRequestReviewComments(this.pullId),
    ]);

    if (files instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request files: ${files.message}`);
      return [];
    }

    if (reviewComments instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request review comments: ${reviewComments.message}`);
      return this._toTree(files, []);
    }

    return this._toTree(files, reviewComments);
  };
}
