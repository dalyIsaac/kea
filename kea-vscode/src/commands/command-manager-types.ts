import { IAccountManager } from "../account/account-manager";
import { ILruApiCache } from "../cache/lru-api/lru-api-cache";
import { IKeaDisposable } from "../core/kea-disposable";
import { TreeDecorationManager } from "../decorations/tree-decoration-manager";
import { IRepositoryManager } from "../repository/repository-manager";
import { PullRequestContentsProvider } from "../views/pull-request-contents/pull-request-contents-provider";
import { PullRequestListTreeProvider } from "../views/pull-request-list/pull-request-list-tree-provider";
import { createCheckoutPullRequest } from "./commands/checkout-pull-request";
import { createOpenPullRequestCommand } from "./commands/open-pull-request";
import {
  createCollapsePullRequestTreeCommand,
  createRefreshPullRequestContentsCommand,
  createRefreshPullRequestListCommand,
} from "./commands/small-commands";

export interface CreateCommandArg {
  accountManager: IAccountManager;
  repositoryManager: IRepositoryManager;
  pullRequestContentsProvider: PullRequestContentsProvider;
  pullRequestListTreeProvider: PullRequestListTreeProvider;
  cache: ILruApiCache;
  treeDecorationManager: TreeDecorationManager;
}

type CreateCommand = (args: CreateCommandArg) => unknown;

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
