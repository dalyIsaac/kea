import * as vscode from "vscode";
import { IAccountKey } from "../account/account";
import { IKeaContext } from "../core/context";
import { Logger } from "../core/logger";
import { formatDate } from "../core/utils";
import { RepoInfo } from "../git/git-manager";
import { PullRequest, PullRequestId } from "../types/kea";

interface PullRequestQuickPickItem extends vscode.QuickPickItem {
  accountKey: IAccountKey;
  pullRequestId: PullRequestId;
}

export const createPullRequestListQuickPick = async (ctx: IKeaContext): Promise<PullRequestQuickPickItem[]> => {
  const allRepos = await ctx.gitManager.getAllRepositoriesAndInfo();

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
        info: createPullRequestQuickPickItem(pr, repoInfo),
        updatedAt: pr.updatedAt,
      }));
    }),
  );

  const pullRequests = nestedPullRequests.flat();
  pullRequests.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0));

  return pullRequests.map((pr) => pr.info);
};

const createPullRequestQuickPickItem = (pr: PullRequest, repoInfo: RepoInfo): PullRequestQuickPickItem => ({
  accountKey: repoInfo.account.accountKey,
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
