import * as vscode from "vscode";
import { getGitApi, getGitRepository } from "../../core/git";
import { Logger } from "../../core/logger";
import { createPullRequestBranchPicks } from "../../quick-picks/pull-request-branch-picks";
import { PullRequestGitRef } from "../../types/kea";
import { CreateCommandArg } from "../command-manager-types";

export interface ICheckoutPullRequestCommandArgs {
  pullRequestHead: PullRequestGitRef;
  workspaceFolder: vscode.WorkspaceFolder;
}

export const createCheckoutPullRequest =
  ({ accountManager, repositoryManager, cache }: CreateCommandArg) =>
  async (args?: ICheckoutPullRequestCommandArgs): Promise<Error | void> => {
    if (args === undefined) {
      const results = await vscode.window.showQuickPick(createPullRequestBranchPicks(accountManager, repositoryManager, cache), {
        canPickMany: false,
        placeHolder: "Select a pull request to checkout",
      });

      if (results === undefined) {
        return;
      }

      args = {
        pullRequestHead: results.pullRequestHead,
        workspaceFolder: results.workspaceFolder,
      };
    }

    const branchName = args.pullRequestHead.ref;
    const workspaceFolder = args.workspaceFolder;

    const repository = await getGitRepository(workspaceFolder);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
      return;
    }

    const api = await getGitApi();
    if (api instanceof Error) {
      Logger.error("Error getting Git API", api);
      return;
    }

    try {
      await repository.checkout(branchName);
      Logger.info(`Checked out branch ${branchName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      vscode.window.showErrorMessage(`Failed to checkout branch ${branchName}: ${errorMessage}`);
    }
  };
