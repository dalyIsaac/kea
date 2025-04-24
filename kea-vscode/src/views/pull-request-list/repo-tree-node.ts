import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { PullRequestListNode } from "./pull-request-list-node";

export class RepoTreeNode implements IParentTreeNode<PullRequestListNode> {
  static #contextValue = "repository";

  #ctx: IKeaContext;
  collapsibleState: CollapsibleState;

  repository: IKeaRepository;
  workspace: vscode.WorkspaceFolder;

  constructor(ctx: IKeaContext, repository: IKeaRepository, workspace: vscode.WorkspaceFolder) {
    this.#ctx = ctx;

    this.repository = repository;
    this.workspace = workspace;

    this.collapsibleState = "collapsed";
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.workspace.name, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = RepoTreeNode.#contextValue;
    treeItem.description = this.repository.remoteUrl;
    return treeItem;
  };

  getChildren = async (): Promise<PullRequestListNode[]> => {
    const pullRequests = await this.repository.getPullRequestList();
    if (pullRequests instanceof Error) {
      Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
      return [];
    }

    return pullRequests.map((pr) => new PullRequestListNode(this.#ctx, this.repository.account.accountKey, pr, this.workspace));
  };
}
