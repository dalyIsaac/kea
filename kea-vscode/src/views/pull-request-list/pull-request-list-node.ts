import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { ICheckoutPullRequestCommandArgs } from "../../commands/commands/checkout-pull-request";
import { createKeaCommand } from "../../commands/create-command";
import { IKeaContext } from "../../core/context";
import { trimLength } from "../../core/utils";
import { PullRequest, PullRequestGitRef, PullRequestId } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, ITreeNode } from "../tree-node";

export class PullRequestListNode implements ITreeNode, ICheckoutPullRequestCommandArgs {
  #ctx: IKeaContext;

  collapsibleState: CollapsibleState = "none";

  accountKey: IAccountKey;
  pullRequest: PullRequest;
  workspaceFolder: vscode.WorkspaceFolder;

  get pullRequestHead(): PullRequestGitRef {
    return this.pullRequest.head;
  }

  constructor(ctx: IKeaContext, accountKey: IAccountKey, pullRequest: PullRequest, workspaceFolder: vscode.WorkspaceFolder) {
    this.#ctx = ctx;

    this.collapsibleState = "none";

    this.accountKey = accountKey;
    this.pullRequest = pullRequest;
    this.workspaceFolder = workspaceFolder;
  }

  getTreeItem = async (): Promise<vscode.TreeItem> => {
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

    const branch = await this.#ctx.gitManager.getGitBranchForRepository(this.workspaceFolder);
    const isCheckedOut = branch instanceof Error ? false : branch.name === head;

    const iconPath = isCheckedOut ? new vscode.ThemeIcon("git-branch") : "";

    return {
      label: this.pullRequest.title,
      description,
      collapsibleState: getCollapsibleState(this.collapsibleState),
      contextValue: `pullRequest${isCheckedOut ? ":checkedout" : ""}`, // Add state to contextValue
      command: createKeaCommand({
        title: "Open Pull Request",
        command: "kea.openPullRequest",
        tooltip: "Open Pull Request",
        args: [{ accountKey: this.accountKey, pullId }],
      }),
      tooltip: `${head}...${base}${isCheckedOut ? " (Checked out)" : ""}`,
      iconPath: iconPath,
    };
  };
}
