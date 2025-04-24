import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { createPullRequestListQuickPick } from "../../quick-picks/pull-request-list-picks";
import { PullRequestId } from "../../types/kea";

export const createOpenPullRequestCommand = (ctx: IKeaContext) => async (args?: [IAccountKey, PullRequestId]) => {
  const { repositoryManager, pullRequestContents, treeDecorationManager } = ctx;

  if (args === undefined) {
    const results = await vscode.window.showQuickPick(createPullRequestListQuickPick(ctx), {
      canPickMany: false,
      placeHolder: "Select a pull request to open",
    });

    if (results === undefined) {
      return;
    }

    args = [results.accountKey, results.pullRequestId];
  }

  const [accountKey, pullId] = args;
  await pullRequestContents.treeViewProvider.openPullRequest(accountKey, pullId);

  const repository = repositoryManager.getRepositoryById(accountKey, pullId);
  if (repository instanceof Error) {
    Logger.error("Error getting repository", repository);
    return;
  }

  treeDecorationManager.updateListeners(repository);
};
