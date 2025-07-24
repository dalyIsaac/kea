import * as vscode from "vscode";
import { ICheckoutPullRequestCommandArgs } from "../../commands/commands/checkout-pull-request";
import { IKeaContext } from "../../core/context";
import { trimLength } from "../../core/utils";
import { IRepository } from "../../repository/repository";
import { PullRequest, PullRequestGitRef, PullRequestId } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, ITreeNode } from "../tree-node";

export class PullRequestListNode implements ITreeNode, ICheckoutPullRequestCommandArgs {
  protected _ctx: IKeaContext;
  protected _pullRequest: PullRequest;
  protected _repository: IRepository;

  collapsibleState: CollapsibleState = "none";

  constructor(ctx: IKeaContext, pullRequest: PullRequest, repository: IRepository) {
    this.collapsibleState = "none";

    this._ctx = ctx;
    this._repository = repository;
    this._pullRequest = pullRequest;
  }

  get pullRequestHead(): PullRequestGitRef {
    return this._pullRequest.head;
  }

  get workspaceFolder(): vscode.WorkspaceFolder {
    return this._repository.localRepository.workspaceFolder;
  }

  getTreeItem = async (): Promise<vscode.TreeItem> => {
    const pullId: PullRequestId = {
      owner: this._pullRequest.repository.owner,
      repo: this._pullRequest.repository.name,
      number: this._pullRequest.number,
    };

    const head = this._pullRequest.head.ref;
    const shortHead = trimLength(head, 16);
    const base = this._pullRequest.base.ref;

    let description = `#${this._pullRequest.number}`;
    if (this._pullRequest.user?.login) {
      description += ` by ${this._pullRequest.user.login}`;
    }
    description += ` (${shortHead})`;

    const branch = await this._repository.localRepository.getCurrentBranch();
    const isCheckedOut = branch instanceof Error ? false : branch === head;

    const iconPath = isCheckedOut ? new vscode.ThemeIcon("git-branch") : "";

    return {
      label: this._pullRequest.title,
      description,
      collapsibleState: getCollapsibleState(this.collapsibleState),
      contextValue: `pullRequest${isCheckedOut ? ":checkedout" : ""}`,
      command: this._ctx.commandManager.createCommand("kea.openPullRequest", "Open Pull Request", {
        accountKey: this._repository.remoteRepository.account.accountKey,
        pullRequestId: pullId,
      }),
      tooltip: `${head}...${base}${isCheckedOut ? " (Checked out)" : ""}`,
      iconPath: iconPath,
    };
  };
}
