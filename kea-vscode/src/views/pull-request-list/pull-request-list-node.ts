import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { ICheckoutPullRequestCommandArgs } from "../../commands/commands/checkout-pull-request";
import { trimLength } from "../../core/utils";
import { PullRequest, PullRequestGitRef, PullRequestId } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, ITreeNode } from "../tree-node";

export class PullRequestListNode implements ITreeNode, ICheckoutPullRequestCommandArgs {
  collapsibleState: CollapsibleState = "none";

  accountKey: IAccountKey;
  pullRequest: PullRequest;
  workspaceFolder: vscode.WorkspaceFolder;

  get pullRequestHead(): PullRequestGitRef {
    return this.pullRequest.head;
  }

  constructor(accountKey: IAccountKey, pullRequest: PullRequest, workspaceFolder: vscode.WorkspaceFolder) {
    this.collapsibleState = "none";

    this.accountKey = accountKey;
    this.pullRequest = pullRequest;
    this.workspaceFolder = workspaceFolder;
  }

  getTreeItem = (): vscode.TreeItem => {
    const pullId: PullRequestId = {
      owner: this.pullRequest.repository.owner,
      repo: this.pullRequest.repository.name,
      number: this.pullRequest.number,
    };

    const head = this.pullRequest.head.ref;
    const shortHead = trimLength(head, 16);
    const base = this.pullRequest.base.ref;

    let description = `#${this.pullRequest.number}`;
    if (this.pullRequest.user?.login) {
      description += ` by ${this.pullRequest.user.login}`;
    }
    description += ` (${shortHead})`;

    return {
      label: this.pullRequest.title,
      description,
      collapsibleState: getCollapsibleState(this.collapsibleState),
      contextValue: "pullRequest",
      command: {
        command: "kea.openPullRequest",
        title: "Open Pull Request",
        arguments: [[this.accountKey, pullId]],
      },
      tooltip: `${head}...${base}`,
    };
  };
}
