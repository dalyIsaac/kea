import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { IRemoteRepository } from "../../repository/remote-repository";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { PullRequestListNode } from "./pull-request-list-node";

export class RepoTreeNode implements IParentTreeNode<PullRequestListNode> {
  static #contextValue = "repository";

  #ctx: IKeaContext;
  #remoteRepository: IRemoteRepository;
  #workspace: vscode.WorkspaceFolder;
  collapsibleState: CollapsibleState;

  constructor(ctx: IKeaContext, remoteRepository: IRemoteRepository, workspace: vscode.WorkspaceFolder) {
    this.#ctx = ctx;

    this.#remoteRepository = remoteRepository;
    this.#workspace = workspace;

    this.collapsibleState = "collapsed";
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.#workspace.name, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = RepoTreeNode.#contextValue;
    treeItem.description = this.#remoteRepository.remoteUrl;
    return treeItem;
  };

  getChildren = async (): Promise<PullRequestListNode[]> => {
    const pullRequests = await this.#remoteRepository.getPullRequestList();
    if (pullRequests instanceof Error) {
      Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
      return [];
    }

    return pullRequests.map((pr) => new PullRequestListNode(this.#ctx, this.#remoteRepository.account.accountKey, pr, this.#workspace));
  };
}
