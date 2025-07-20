import * as vscode from "vscode";
import { IKeaContext } from "../core/context";
import { IKeaDisposable } from "../core/kea-disposable";
import { createCheckoutPullRequest } from "./commands/checkout-pull-request";
import { createOpenCommitFileDiffCommand } from "./commands/open-commit-file-diff";
import { createOpenPullRequestCommand } from "./commands/open-pull-request";
import {
  createCollapsePullRequestTreeCommand,
  createRefreshPullRequestContentsCommand,
  createRefreshPullRequestListCommand,
} from "./commands/small-commands";

type CreateCommand = (ctx: IKeaContext) => unknown;

export const COMMANDS = {
  "kea.openPullRequest": createOpenPullRequestCommand,
  "kea.refreshPullRequestList": createRefreshPullRequestListCommand,
  "kea.refreshPullRequestContents": createRefreshPullRequestContentsCommand,
  "kea.collapsePullRequestTree": createCollapsePullRequestTreeCommand,
  "kea.checkoutPullRequest": createCheckoutPullRequest,
  "kea.openCommitFileDiff": createOpenCommitFileDiffCommand,
} satisfies Record<string, CreateCommand>;

export type CommandMap = Record<keyof typeof COMMANDS, ReturnType<(typeof COMMANDS)[keyof typeof COMMANDS]>>;

export interface ICommandManager extends IKeaDisposable {
  executeCommand: (commandName: keyof typeof COMMANDS, ...args: unknown[]) => Thenable<void>;
  getCommand: (commandName: keyof typeof COMMANDS, title: string, ...args: unknown[]) => vscode.Command;
}
