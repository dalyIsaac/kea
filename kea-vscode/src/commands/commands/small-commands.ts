import * as vscode from "vscode";
import { CreateCommandArg } from "../command-manager-types";

export const createRefreshPullRequestListCommand =
  ({ pullRequestListTreeProvider }: CreateCommandArg) =>
  () => {
    pullRequestListTreeProvider.refresh();
  };

export const createRefreshPullRequestContentsCommand =
  ({ pullRequestContentsProvider }: CreateCommandArg) =>
  () => {
    pullRequestContentsProvider.refresh();
  };

export const createCollapsePullRequestTreeCommand = () => async () => {
  await vscode.commands.executeCommand("workbench.actions.treeView.kea.pullRequestContents.collapseAll");
};
