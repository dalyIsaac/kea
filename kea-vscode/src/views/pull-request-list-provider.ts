import { WorkspaceFolder } from "vscode";
import { getRepo } from "../git";
import { vscode } from "../types/aliases";
import { Repository } from "../types/git";

export class PullRequestListProvider implements vscode.TreeDataProvider<PullRequestTreeItem> {
  getTreeItem = (element: PullRequestTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (
    element?: PullRequestTreeItem | undefined,
  ): vscode.ProviderResult<PullRequestTreeItem[]> => {
    if (element === undefined) {
      // No element is selected, so we return the root items.
      return vscode.workspace.workspaceFolders
        ?.map((workspace) => PullRequestTreeItem.create(workspace))
        .filter((item) => item !== null);
    }

    return [];
  };
}

export class PullRequestTreeItem extends vscode.TreeItem {
  #workspace: WorkspaceFolder;
  #repo: Repository;

  private constructor(workspace: WorkspaceFolder, repo: Repository) {
    super(workspace.name, vscode.TreeItemCollapsibleState.None);
    this.#workspace = workspace;
    this.#repo = repo;
  }

  static create = (workspace: WorkspaceFolder): PullRequestTreeItem | null => {
    const repo = getRepo(workspace.uri);
    if (repo === null) {
      return null;
    }

    return new PullRequestTreeItem(workspace, repo);
  };
}
