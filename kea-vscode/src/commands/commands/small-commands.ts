import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";

export const createRefreshPullRequestListCommand =
  ({ pullRequestListTreeProvider }: IKeaContext) =>
  () => {
    pullRequestListTreeProvider.refresh();
  };

export const createRefreshPullRequestContentsCommand =
  ({ pullRequestContentsProvider }: IKeaContext) =>
  () => {
    pullRequestContentsProvider.refresh();
  };

export const createCollapsePullRequestTreeCommand = () => async () => {
  await vscode.commands.executeCommand("workbench.actions.treeView.kea.pullRequestContents.collapseAll");
};
