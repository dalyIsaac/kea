import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { createPullRequestBranchPicks } from "../../quick-picks/pull-request-branch-picks";
import { PullRequestGitRef } from "../../types/kea";

export interface ICheckoutPullRequestCommandArgs {
  pullRequestHead: PullRequestGitRef;
  workspaceFolder: vscode.WorkspaceFolder;
}

export const createCheckoutPullRequest =
  (ctx: IKeaContext) =>
  async (args?: ICheckoutPullRequestCommandArgs): Promise<Error | void> => {
    if (args === undefined) {
      const results = await vscode.window.showQuickPick(createPullRequestBranchPicks(ctx), {
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

    const repository = await ctx.gitManager.getGitRepository(workspaceFolder);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
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
