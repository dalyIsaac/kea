import * as vscode from "vscode";
import { Logger } from "../../../core/logger";
import { IKeaRepository } from "../../../repository/kea-repository";
import { PullRequestId } from "../../../types/kea";
import { BaseFilesRootTreeNode, FilesRootTreeNodeChild } from "../../common/base-files-root-tree-node";
import { CollapsibleState, getCollapsibleState } from "../../tree-node";

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

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.#label, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;
    return treeItem;
  };

  getChildren = async (): Promise<FilesRootTreeNodeChild[]> => {
    const [files, reviewComments, pullRequestCommits] = await Promise.all([
      this._repository.getPullRequestFiles(this.pullId),
      this._repository.getPullRequestReviewComments(this.pullId),
      this._repository.getPullRequestCommits(this.pullId),
    ]);

    if (files instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request files: ${files.message}`);
      return [];
    }

    if (pullRequestCommits instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request commits: ${pullRequestCommits.message}`);
      return [];
    }

    const lastCommit = pullRequestCommits.at(-1);
    if (lastCommit === undefined) {
      Logger.warn(`No commits found for pull request ${this.pullId.owner}/${this.pullId.repo}/${this.pullId.number}`);
      return [];
    }

    if (reviewComments instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request review comments: ${reviewComments.message}`);
      return this._toTree(files, [], lastCommit);
    }

    return this._toTree(files, reviewComments, lastCommit);
  };
}
