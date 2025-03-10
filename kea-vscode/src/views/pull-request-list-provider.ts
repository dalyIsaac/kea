import * as vscode from "vscode";
import { WorkspaceFolder } from "vscode";
import { GitHubAccount } from "../account/github-account";
import { AppContext } from "../core/app-context";
import { getRepo } from "../core/git";
import { Logger } from "../core/logger";
import { Repository } from "../types/git";

type PullRequestListItem = RepoTreeItem;

export class PullRequestListProvider implements vscode.TreeDataProvider<PullRequestListItem> {
  #onDidChangeTreeData = new vscode.EventEmitter<void | PullRequestListItem | null | undefined>();

  readonly onDidChangeTreeData: vscode.Event<void | PullRequestListItem | null | undefined> =
    this.#onDidChangeTreeData.event;

  getTreeItem = (element: PullRequestListItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (
    element?: PullRequestListItem | undefined,
  ): vscode.ProviderResult<PullRequestListItem[]> => {
    if (element === undefined) {
      Logger.info("Fetching root items for PullRequestListProvider");
      return this.#getRootChildren();
    }

    return [];
  };

  #getRootChildren = async (): Promise<RepoTreeItem[]> => {
    const allItems = vscode.workspace.workspaceFolders?.map((workspace) =>
      RepoTreeItem.create(workspace),
    );
    if (allItems === undefined) {
      Logger.error("No workspace folders found");
      return [];
    }

    const resolvedItems = await Promise.all(allItems);

    const rootItems: RepoTreeItem[] = [];
    for (const item of resolvedItems) {
      if (item instanceof Error) {
        Logger.error(`Error creating PullRequestTreeItem: ${item.message}`);
        continue;
      }

      rootItems.push(item);
    }

    return rootItems;
  };

  refresh = async (): Promise<void> => {
    Logger.info("Refreshing PullRequestListProvider");
    this.#onDidChangeTreeData.fire();
  };
}

class RepoTreeItem extends vscode.TreeItem {
  workspace: WorkspaceFolder;
  repo: Repository;

  private constructor(workspace: WorkspaceFolder, repo: Repository, repoUrl: string) {
    super(workspace.name, vscode.TreeItemCollapsibleState.None);

    this.workspace = workspace;
    this.repo = repo;
    this.description = repoUrl;
  }

  static create = async (workspace: WorkspaceFolder): Promise<RepoTreeItem | Error> => {
    const repo = await getRepo(workspace.uri);
    if (repo instanceof Error) {
      return repo;
    }

    const remote = repo.state.remotes[0];
    if (remote === undefined) {
      return new Error("No remotes found");
    }

    const repoUrl = remote.fetchUrl ?? remote.pushUrl;
    if (repoUrl === undefined) {
      return new Error("No fetch or push URL found");
    }

    if (GitHubAccount.isGitHubUrl(repoUrl)) {
      const gitHubAccount = await AppContext.getGitHubAccount();

      if (gitHubAccount instanceof Error) {
        Logger.error(`Error creating GitHub account: ${gitHubAccount.message}`);
      } else {
        const userProfile = await gitHubAccount.getUserProfile();
        if (userProfile instanceof Error) {
          Logger.error(`Error fetching GitHub user profile: ${userProfile.message}`);
        } else {
          Logger.info(`GitHub user profile: ${userProfile.login} (${userProfile.name})`);
        }
      }
    }

    return new RepoTreeItem(workspace, repo, repoUrl);
  };
}
