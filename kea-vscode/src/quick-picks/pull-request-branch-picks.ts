import * as vscode from "vscode";
import { ICheckoutPullRequestCommandArgs } from "../commands/commands/checkout-pull-request";
import { IKeaContext } from "../core/context";
import { getAllRepositories, RepoInfo } from "../core/git";
import { Logger } from "../core/logger";
import { formatDate } from "../core/utils";
import { PullRequest } from "../types/kea";

interface PullRequestBranchQuickPickItem extends vscode.QuickPickItem, ICheckoutPullRequestCommandArgs {}

export const createPullRequestBranchPicks = async (ctx: IKeaContext): Promise<PullRequestBranchQuickPickItem[]> => {
  const allRepos = await getAllRepositories(ctx);

  const nestedPullRequests = await Promise.all(
    allRepos.map(async (repoInfo) => {
      if (repoInfo instanceof Error) {
        Logger.error(`Error creating RepoTreeNode: ${repoInfo.message}`);
        return [];
      }

      const { repository } = repoInfo;
      const pullRequests = await repository.getPullRequestList();
      if (pullRequests instanceof Error) {
        Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
        return [];
      }

      return pullRequests.map((pr) => ({
        info: createPullRequestBranchQuickPickItem(pr, repoInfo),
        updatedAt: pr.updatedAt,
      }));
    }),
  );

  const pullRequests = nestedPullRequests.flat();
  pullRequests.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0));

  return pullRequests.map((pr) => pr.info);
};

const createPullRequestBranchQuickPickItem = (pr: PullRequest, repoInfo: RepoInfo): PullRequestBranchQuickPickItem => ({
  pullRequestHead: pr.head,
  workspaceFolder: repoInfo.workspaceFolder,
  label: pr.head.ref,
  description: pr.title,
  detail: `Remote last modified: ${formatDate(pr.updatedAt)}`,
  picked: false,
  alwaysShow: true,
});
