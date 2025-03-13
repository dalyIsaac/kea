import * as vscode from "vscode";
import { PullRequest, PullRequestId } from "../../types/kea";

export class PullRequestTreeItem extends vscode.TreeItem {
  // Overrides.
  contextValue = "pullRequest";

  constructor(accountName: string, pullRequest: PullRequest) {
    super(pullRequest.title, vscode.TreeItemCollapsibleState.None);

    const pullId: PullRequestId = {
      owner: pullRequest.repository.owner,
      repo: pullRequest.repository.name,
      number: pullRequest.number,
    };

    this.command = {
      command: "kea.openPullRequest",
      title: "Open Pull Request",
      arguments: [[accountName, pullId, pullRequest]],
    };
  }
}
