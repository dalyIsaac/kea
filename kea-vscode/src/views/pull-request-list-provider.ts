import { WorkspaceFolder } from "vscode";
import { vscode } from "../aliases";

export class PullRequestListProvider implements vscode.TreeDataProvider<PullRequestTreeItem> {
  getTreeItem = (element: PullRequestTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (
    element?: PullRequestTreeItem | undefined,
  ): vscode.ProviderResult<PullRequestTreeItem[]> => {
    if (element === undefined) {
      return vscode.workspace.workspaceFolders?.map(
        (workspace) => new PullRequestTreeItem(workspace),
      );
    }
    return [];
  };
}

export class PullRequestTreeItem extends vscode.TreeItem {
  constructor(workspace: WorkspaceFolder) {
    super(workspace.name, vscode.TreeItemCollapsibleState.Collapsed);
  }
}
