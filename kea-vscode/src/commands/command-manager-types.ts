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

export const KEA_COMMANDS = {
  "kea.openPullRequest": createOpenPullRequestCommand,
  "kea.refreshPullRequestList": createRefreshPullRequestListCommand,
  "kea.refreshPullRequestContents": createRefreshPullRequestContentsCommand,
  "kea.collapsePullRequestTree": createCollapsePullRequestTreeCommand,
  "kea.checkoutPullRequest": createCheckoutPullRequest,
} satisfies Record<string, CreateCommand>;

export type KeaCommandMap = Record<keyof typeof KEA_COMMANDS, ReturnType<(typeof KEA_COMMANDS)[keyof typeof KEA_COMMANDS]>>;

export interface TypedCommand<TCommand extends keyof typeof KEA_COMMANDS> {
  /**
   * Title of the command, like `save`.
   */
  title: string;

  /**
   * The identifier of the actual command handler.
   */
  command: TCommand;

  /**
   * A tooltip for the command, when represented in the UI.
   */
  tooltip?: string | undefined;

  /**
   * Arguments that the command handler should be invoked with.
   */
  args: Parameters<ReturnType<(typeof KEA_COMMANDS)[TCommand]>>;
}

export interface ICommandManager extends IKeaDisposable {
  executeCommand: <TCommand extends keyof typeof KEA_COMMANDS>(
    commandName: TCommand,
    ...args: Parameters<(typeof KEA_COMMANDS)[TCommand]>
  ) => Thenable<void>;
}
