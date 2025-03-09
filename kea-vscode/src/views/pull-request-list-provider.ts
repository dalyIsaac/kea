import * as vscode from "vscode";
import { WorkspaceFolder } from "vscode";
import { Repository } from "../types/git";
import { getRepo } from "../utils/git";
import { Logger } from "../utils/logger";

type PullRequestListItem = RepoTreeItem;

export class PullRequestListProvider implements vscode.TreeDataProvider<PullRequestListItem> {
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

    return new RepoTreeItem(workspace, repo, repoUrl);
  };
}
