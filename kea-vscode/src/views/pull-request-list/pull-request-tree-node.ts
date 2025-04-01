import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { PullRequest } from "../../types/kea";
import { CollapsibleState, ITreeNode } from "../tree-node";

export class PullRequestTreeNode implements ITreeNode {
  collapsibleState: CollapsibleState;

  accountKey: IAccountKey;
  pullRequest: PullRequest;

  constructor(accountKey: IAccountKey, pullRequest: PullRequest) {
    this.accountKey = accountKey;
    this.pullRequest = pullRequest;

    this.collapsibleState = "none";
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.pullRequest.title, vscode.TreeItemCollapsibleState.None);
    treeItem.contextValue = "pullRequest";

    treeItem.command = {
      command: "kea.openPullRequest",
      title: "Open Pull Request",
      arguments: [[this.accountKey, this.pullRequest]],
    };

    return treeItem;
  };
}
