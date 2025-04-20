import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { Logger } from "../../core/logger";
import { createPullRequestListQuickPick } from "../../quick-picks/pull-request-list-picks";
import { PullRequestId } from "../../types/kea";
import { CreateCommandArg } from "../command-manager-types";

export const createOpenPullRequestCommand =
  ({ accountManager, repositoryManager, pullRequestContentsProvider, cache, treeDecorationManager }: CreateCommandArg) =>
  async (args?: [IAccountKey, PullRequestId]) => {
    if (args === undefined) {
      const results = await vscode.window.showQuickPick(createPullRequestListQuickPick(accountManager, repositoryManager, cache), {
        canPickMany: false,
        placeHolder: "Select a pull request to open",
      });

      if (results === undefined) {
        return;
      }

      args = [results.accountKey, results.pullRequestId];
    }

    const [accountKey, pullId] = args;
    await pullRequestContentsProvider.openPullRequest(accountKey, pullId);

    const repository = repositoryManager.getRepositoryById(accountKey, pullId);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
      return;
    }

    treeDecorationManager.updateListeners(repository);
  };
