import * as vscode from "vscode";
import { IAccount } from "../account/account";
import { IAccountManager } from "../account/account-manager";
import { ILruApiCache } from "../lru-cache/lru-api-cache";
import { IKeaRepository } from "../repository/kea-repository";
import { IRepositoryManager } from "../repository/repository-manager";
import { API, GitExtension } from "../types/git";
import { Logger } from "./logger";
import { WrappedError } from "./wrapped-error";

export interface RepoInfo {
  repository: IKeaRepository;
  workspace: vscode.WorkspaceFolder;
  account: IAccount;
}

export const getAllRepositories = async (
  accountManager: IAccountManager,
  repositoryManager: IRepositoryManager,
  cache: ILruApiCache,
): Promise<Array<RepoInfo | Error>> =>
  Promise.all(
    vscode.workspace.workspaceFolders?.map(async (workspace) => {
      const api = await getGitApi();
      if (api instanceof Error) {
        return api;
      }

      const repo = api.getRepository(workspace.uri);
      if (repo === null) {
        return new Error(`No repository found for ${workspace.uri.toString()}`);
      }

      return getRepo(accountManager, repositoryManager, workspace, cache);
    }) ?? [],
  );

const getRepo = async (
  accountManager: IAccountManager,
  repositoryManager: IRepositoryManager,
  workspace: vscode.WorkspaceFolder,
  cache: ILruApiCache,
): Promise<RepoInfo | Error> => {
  const api = await getGitApi();
  if (api instanceof Error) {
    return api;
  }

  // Open the repository if it is not already opened. This can occur if the Kea extension is
  // activated before the Git extension.
  const repo = api.getRepository(workspace.uri) ?? (await api.openRepository(workspace.uri));
  if (repo === null) {
    return new Error(`No repository found for ${workspace.uri.toString()}`);
  }

  const remote = repo.state.remotes[0];
  if (remote === undefined) {
    return new Error("No remotes found");
  }

  const repoUrl = remote.fetchUrl ?? remote.pushUrl;
  if (repoUrl === undefined) {
    return new Error("No fetch or push URL found");
  }

  for (const account of await accountManager.getAllAccounts()) {
    if (account instanceof Error) {
      Logger.error(account);
      continue;
    }

    const repo = account.tryCreateRepoForAccount(repoUrl, cache);
    if (repo instanceof Error) {
      Logger.error(`Error creating repository for account`, repo);
      continue;
    }

    repositoryManager.addRepository(repo);
    return { repository: repo, workspace, account };
  }

  return new Error("No account found for repository");
};

const getGitApi = async (): Promise<API | Error> => {
  const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (gitExtension === undefined) {
    return new Error("Git extension not found");
  }

  if (!gitExtension.isActive) {
    try {
      await gitExtension.activate();
    } catch (error) {
      return new WrappedError("Failed to activate Git extension", error);
    }
  }

  return gitExtension.exports.getAPI(1);
};
