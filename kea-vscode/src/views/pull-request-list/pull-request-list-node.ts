import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { PullRequest, PullRequestId } from "../../types/kea";
import { CollapsibleState, ITreeNode } from "../tree-node";

export class PullRequestListNode implements ITreeNode {
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

    const pullId: PullRequestId = {
      owner: this.pullRequest.repository.owner,
      repo: this.pullRequest.repository.name,
      number: this.pullRequest.number,
    };

    treeItem.command = {
      command: "kea.openPullRequest",
      title: "Open Pull Request",
      arguments: [[this.accountKey, pullId]],
    };

    return treeItem;
  };
}
