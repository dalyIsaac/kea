import { IKeaContext } from "../core/context";
import { IKeaDisposable } from "../core/kea-disposable";
import { createCheckoutPullRequest } from "./commands/checkout-pull-request";
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
} satisfies Record<string, CreateCommand>;

export type CommandMap = Record<keyof typeof COMMANDS, ReturnType<(typeof COMMANDS)[keyof typeof COMMANDS]>>;

export interface ICommandManager extends IKeaDisposable {
  executeCommand: <T extends keyof typeof COMMANDS>(commandName: T, ...args: Parameters<(typeof COMMANDS)[T]>) => Thenable<void>;
}
