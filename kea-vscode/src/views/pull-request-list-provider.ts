import { vscode } from "../aliases";

export class PullRequestListProvider implements vscode.TreeDataProvider<PullRequestTreeItem> {
  getTreeItem = (element: PullRequestTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> => {
    return element;
  };

  getChildren = (
    element?: PullRequestTreeItem | undefined,
  ): vscode.ProviderResult<PullRequestTreeItem[]> => {
    return [];
  };
}

export class PullRequestTreeItem extends vscode.TreeItem {
  // TODO
}
