import * as vscode from "vscode";
import { getGitApi, getGitRepository } from "../../core/git";
import { Logger } from "../../core/logger";
import { PullRequest } from "../../types/kea";

export interface ICheckoutPullRequestCommandArgs {
  pullRequest: PullRequest;
  workspaceFolder: vscode.WorkspaceFolder;
}

export const createCheckoutPullRequest =
  () =>
  async (args?: ICheckoutPullRequestCommandArgs): Promise<Error | void> => {
    if (args === undefined) {
      // TODO: Show a quick pick to select a branch
      Logger.warn("No branch name provided");
      return;
    }

    const branchName = args.pullRequest.head.ref;
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
