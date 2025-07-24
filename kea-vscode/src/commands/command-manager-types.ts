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

export type CommandName = keyof typeof COMMANDS;

export type CommandMap = Record<keyof typeof COMMANDS, ReturnType<(typeof COMMANDS)[keyof typeof COMMANDS]>>;

export type CommandArgs<TCommandName extends CommandName> = (typeof COMMANDS)[TCommandName] extends (
  ctx: IKeaContext,
) => (...args: infer P) => unknown
  ? P
  : never;

export interface ICommandManager extends IKeaDisposable {
  executeCommand: (commandName: CommandName, ...args: unknown[]) => Thenable<void>;
  createCommand: <TCommandName extends CommandName>(
    commandName: TCommandName,
    title: string,
    ...args: CommandArgs<TCommandName>
  ) => vscode.Command;
}
