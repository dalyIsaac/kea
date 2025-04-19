import * as vscode from "vscode";
import { Logger } from "../../../core/logger";
import { IKeaRepository } from "../../../repository/kea-repository";
import { PullRequestId } from "../../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../../tree-node";
import { CommitTreeNode } from "./commit-tree-node";

/**
 * Provides information about the commits in the current pull request.
 */
export class CommitsRootTreeNode implements IParentTreeNode<CommitTreeNode> {
  #contextValue = "commit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  #repository: IKeaRepository;
  #pullId: PullRequestId;

  collapsibleState: CollapsibleState = "collapsed";

  constructor(repository: IKeaRepository, pullId: PullRequestId) {
    this.#repository = repository;
    this.#pullId = pullId;
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem("Commits", getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    return treeItem;
  };

  getChildren = async (): Promise<CommitTreeNode[]> => {
    const commits = await this.#repository.getPullRequestCommits(this.#pullId);

    if (commits instanceof Error) {
      Logger.error("Error fetching pull request commits", commits);
      vscode.window.showErrorMessage(`Error fetching pull request commits: ${commits.message}`);
      return [];
    }

    return commits.map((commit) => new CommitTreeNode(this.#repository, commit));
  };
}
