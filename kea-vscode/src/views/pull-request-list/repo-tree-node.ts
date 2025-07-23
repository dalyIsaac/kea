import * as vscode from "vscode";
import { Logger } from "../../core/logger";
import { IRepository } from "../../repository/repository";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { PullRequestListNode } from "./pull-request-list-node";

export class RepoTreeNode implements IParentTreeNode<PullRequestListNode> {
  static #contextValue = "repository";

  #repository: IRepository;
  collapsibleState: CollapsibleState;

  constructor(repository: IRepository) {
    this.#repository = repository;

    this.collapsibleState = "collapsed";
  }

  getTreeItem = (): vscode.TreeItem => {
    const workspace = this.#repository.localRepository.workspaceFolder;
    const treeItem = new vscode.TreeItem(workspace.name, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = RepoTreeNode.#contextValue;
    treeItem.description = this.#repository.remoteRepository.remoteUrl;
    return treeItem;
  };

  getChildren = async (): Promise<PullRequestListNode[]> => {
    const pullRequests = await this.#repository.remoteRepository.getPullRequestList();
    if (pullRequests instanceof Error) {
      Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
      return [];
    }

    return pullRequests.map((pr) => new PullRequestListNode(pr, this.#repository));
  };
}
