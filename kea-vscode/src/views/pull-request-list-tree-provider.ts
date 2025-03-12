import * as vscode from "vscode";
import { WorkspaceFolder } from "vscode";
import { GitHubAccount } from "../account/github-account";
import { AppContext } from "../core/app-context";
import { getRepo } from "../core/git";
import { Logger } from "../core/logger";
import { Repository } from "../types/git";

type PullRequestListItem = RepoTreeItem | PullRequestTreeItem;

export class PullRequestListTreeProvider implements vscode.TreeDataProvider<PullRequestListItem> {
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

    if (element instanceof RepoTreeItem) {
      Logger.info(`Fetching pull requests for ${element.label}`);
      return this.#getPullRequests(element);
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

  #getPullRequests = async (repoTreeItem: RepoTreeItem): Promise<PullRequestTreeItem[]> => {
    const account = await AppContext.getGitHubAccount();
    if (account instanceof Error) {
      Logger.error(`Error creating GitHub account: ${account.message}`);
      return [];
    }

    const pullRequests = await account.getPullRequestList(
      repoTreeItem.owner,
      repoTreeItem.repoName,
    );
    if (pullRequests instanceof Error) {
      Logger.error(`Error fetching pull requests: ${pullRequests.message}`);
      return [];
    }

    const pullRequestItems: PullRequestTreeItem[] = [];
    for (const pullRequest of pullRequests) {
      const pullRequestItem = new PullRequestTreeItem(
        pullRequest.title,
        vscode.TreeItemCollapsibleState.None,
      );
      pullRequestItem.command = {
        command: "kea.openPullRequest",
        title: "Open Pull Request",
        arguments: [pullRequest],
      };
      pullRequestItems.push(pullRequestItem);
    }

    return pullRequestItems;
  };

  refresh = async (): Promise<void> => {
    Logger.info("Refreshing PullRequestListProvider");
    this.#onDidChangeTreeData.fire();
  };
}

class RepoTreeItem extends vscode.TreeItem {
  workspace: WorkspaceFolder;
  repo: Repository;
  remoteUrl: string;
  owner: string;
  repoName: string;

  private constructor(
    workspace: WorkspaceFolder,
    repo: Repository,
    repoUrl: string,
    owner: string,
    repoName: string,
  ) {
    super(workspace.name, vscode.TreeItemCollapsibleState.Collapsed);

    this.workspace = workspace;
    this.repo = repo;
    this.remoteUrl = repoUrl;
    this.owner = owner;
    this.repoName = repoName;

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

    const [owner, repoName] = repoUrl.replace(".git", "").split("/").slice(-2);
    if (owner === undefined || repoName === undefined) {
      return new Error("Invalid repository URL");
    }

    if (GitHubAccount.isGitHubUrl(repoUrl)) {
      const gitHubAccount = await AppContext.getGitHubAccount();

      if (gitHubAccount instanceof Error) {
        Logger.error(`Error creating GitHub account: ${gitHubAccount.message}`);
      }
    }

    return new RepoTreeItem(workspace, repo, repoUrl, owner, repoName);
  };
}

class PullRequestTreeItem extends vscode.TreeItem {
  constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  contextValue = "pullRequest";
}
