import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { ICheckoutPullRequestCommandArgs } from "../../commands/commands/checkout-pull-request";
import { PullRequest, PullRequestId } from "../../types/kea";
import { CollapsibleState, ITreeNode } from "../tree-node";

export class PullRequestListNode implements ITreeNode, ICheckoutPullRequestCommandArgs {
  collapsibleState: CollapsibleState;

  accountKey: IAccountKey;
  pullRequest: PullRequest;
  workspaceFolder: vscode.WorkspaceFolder;

  constructor(accountKey: IAccountKey, pullRequest: PullRequest, workspaceFolder: vscode.WorkspaceFolder) {
    this.collapsibleState = "none";

    this.accountKey = accountKey;
    this.pullRequest = pullRequest;
    this.workspaceFolder = workspaceFolder;
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
