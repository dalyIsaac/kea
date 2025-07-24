import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { formatDate } from "../../core/utils";
import { IRepository } from "../../repository/repository";
import { PullRequest, PullRequestGitRef } from "../../types/kea";

export interface ICheckoutPullRequestCommandArgs {
  pullRequestHead: PullRequestGitRef;
  workspaceFolder: vscode.WorkspaceFolder;
}

interface QuickPickItem extends vscode.QuickPickItem, ICheckoutPullRequestCommandArgs {}

export const createCheckoutPullRequest =
  (ctx: IKeaContext) =>
  async (args?: ICheckoutPullRequestCommandArgs): Promise<Error | void> => {
    if (args === undefined) {
      const results = await vscode.window.showQuickPick(createCheckoutPullRequestQuickPicks(ctx), {
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

    const repository = ctx.repositoryManager.getRepository(workspaceFolder);
    if (repository instanceof Error) {
      Logger.error("Error getting repository", repository);
      return;
    }

    try {
      await repository.localRepository.checkout(branchName);
      Logger.info(`Checked out branch ${branchName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      vscode.window.showErrorMessage(`Failed to checkout branch ${branchName}: ${errorMessage}`);
    }
  };

export const createCheckoutPullRequestQuickPicks = async (ctx: IKeaContext): Promise<QuickPickItem[]> => {
  const allRepos = ctx.repositoryManager.getAllRepositories();

  const nestedPullRequests = await Promise.all(
    allRepos.map(async (repository) => {
      const pullRequests = await repository.remoteRepository.getPullRequestList();
      if (pullRequests instanceof Error) {
        Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
        return [];
      }

      return pullRequests.map((pr) => ({
        info: createCheckoutPullRequestQuickPickItem(pr, repository),
        updatedAt: pr.updatedAt,
      }));
    }),
  );

  const pullRequests = nestedPullRequests.flat();
  pullRequests.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0));

  return pullRequests.map((pr) => pr.info);
};

const createCheckoutPullRequestQuickPickItem = (pr: PullRequest, repository: IRepository): QuickPickItem => ({
  pullRequestHead: pr.head,
  workspaceFolder: repository.localRepository.workspaceFolder,
  label: pr.head.ref,
  description: pr.title,
  detail: `Remote last modified: ${formatDate(pr.updatedAt)}`,
  picked: false,
  alwaysShow: true,
});
