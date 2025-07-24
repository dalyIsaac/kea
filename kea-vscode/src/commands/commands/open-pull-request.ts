import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { formatDate } from "../../core/utils";
import { IRepository } from "../../repository/repository";
import { PullRequest, PullRequestId } from "../../types/kea";

export interface IOpenPullRequestCommandArgs {
  accountKey: IAccountKey;
  pullRequestId: PullRequestId;
}

interface QuickPickItem extends vscode.QuickPickItem, IOpenPullRequestCommandArgs {}

export const createOpenPullRequestCommand = (ctx: IKeaContext) => async (args?: IOpenPullRequestCommandArgs) => {
  const { repositoryManager, pullRequestContents, treeDecorationManager } = ctx;

  if (args === undefined) {
    const results = await vscode.window.showQuickPick(createOpenPullRequestQuickPicks(ctx), {
      canPickMany: false,
      placeHolder: "Select a pull request to open",
    });

    if (results === undefined) {
      return;
    }

    args = { accountKey: results.accountKey, pullRequestId: results.pullRequestId };
  }

  const { accountKey, pullRequestId } = args;
  await pullRequestContents.treeViewProvider.openPullRequest(accountKey, pullRequestId);

  const repository = repositoryManager.getRepositoryById(accountKey, pullRequestId);
  if (repository instanceof Error) {
    Logger.error("Error getting repository", repository);
    return;
  }

  treeDecorationManager.updateListeners(repository);
};

export const createOpenPullRequestQuickPicks = async (ctx: IKeaContext): Promise<QuickPickItem[]> => {
  const allRepos = ctx.repositoryManager.getAllRepositories();

  const nestedPullRequests = await Promise.all(
    allRepos.map(async (repository) => {
      const pullRequests = await repository.remoteRepository.getPullRequestList();
      if (pullRequests instanceof Error) {
        Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
        return [];
      }

      return pullRequests.map((pr) => ({
        info: createOpenPullRequestQuickPickItem(pr, repository),
        updatedAt: pr.updatedAt,
      }));
    }),
  );

  const pullRequests = nestedPullRequests.flat();
  pullRequests.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0));

  return pullRequests.map((pr) => pr.info);
};

const createOpenPullRequestQuickPickItem = (pr: PullRequest, repository: IRepository): QuickPickItem => ({
  accountKey: repository.remoteRepository.account.accountKey,
  pullRequestId: {
    owner: pr.repository.owner,
    repo: pr.repository.name,
    number: pr.number,
  },
  label: pr.title,
  description: pr.url,
  detail: `Last modified: ${formatDate(pr.updatedAt)}`,
  picked: false,
  alwaysShow: true,
});
