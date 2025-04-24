import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";

export const createRefreshPullRequestListCommand =
  ({ pullRequestListTree }: IKeaContext) =>
  () => {
    pullRequestListTree.treeViewProvider.refresh();
  };

export const createRefreshPullRequestContentsCommand =
  ({ pullRequestContents }: IKeaContext) =>
  () => {
    pullRequestContents.treeViewProvider.refresh();
  };

export const createCollapsePullRequestTreeCommand = () => async () => {
  await vscode.commands.executeCommand("workbench.actions.treeView.kea.pullRequestContents.collapseAll");
};
