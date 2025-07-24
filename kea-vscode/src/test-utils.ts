/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import sinon from "sinon";
import * as vscode from "vscode";
import { IAccount } from "./account/account";
import { IAccountManager } from "./account/account-manager";
import { IApiCache } from "./cache/api/api-cache";
import { IFileCache } from "./cache/file/file-cache";
import { ICommandManager } from "./commands/command-manager-types";
import { IKeaContext } from "./core/context";
import { ITreeDecorationManager } from "./decorations/tree-decoration-manager";
import { IGitManager } from "./git/git-manager";
import { ILocalGitRepository } from "./git/local-git-repository";
import { IRemoteRepository } from "./repository/remote-repository";
import { IRepository } from "./repository/repository";
import { IRepositoryManager } from "./repository/repository-manager";
import { Repository as GitExtensionRepository } from "./types/git";
import { Commit, CommitComment, CommitFile, IssueComment, PullRequest, PullRequestComment, PullRequestGitRef, User } from "./types/kea";
import { PullRequestContentsProvider } from "./views/pull-request-contents/pull-request-contents-provider";
import { PullRequestListTreeProvider } from "./views/pull-request-list/pull-request-list-tree-provider";
import { ITreeNode } from "./views/tree-node";
import { ITreeNodeProvider } from "./views/tree-node-provider";

/**
 * Stubs event properties on an object, allowing you to simulate event listeners and firers for testing purposes.
 *
 * @template TObject - The type of the object to stub.
 * @template TProperties - An array of keys from TObject representing event names.
 * @param stub - The object whose event properties will be stubbed.
 * @param eventNames - An array of property names (keys of TObject) to stub as events.
 * @returns An object containing:
 *   - `stub`: The stubbed object with event properties replaced by listener registration functions.
 *   - `eventFirers`: A record mapping each event name to a function that fires the event with a given payload.
 *
 * @example
 * ```typescript
 * const { stub, eventFirers } = stubEvents(myObject, ['onChange', 'onUpdate']);
 * stub.onChange((payload) => { /* listener code *\/ });
 * eventFirers.onChange({ some: 'data' }); // Fires the event to all listeners
 * ```
 */
export const stubEvents = <TObject extends object, TProperties extends Array<keyof TObject>>(
  stub: TObject,
  eventNames: TProperties,
): { stub: TObject; eventFirers: Record<TProperties[number], (payload: any) => void> } => {
  type EventFirers = Record<TProperties[number], (payload: any) => void>;
  const eventFirers = {} as EventFirers;
  const stubCopy = { ...stub };

  for (const prop of eventNames) {
    const eventName = prop;
    const listeners: any[] = [];

    // @ts-expect-error Not worth the effort typing.
    stubCopy[eventName] = (callback: any) => {
      listeners.push(callback);
      return {
        dispose: () => {
          const index = listeners.indexOf(callback);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        },
      };
    };

    eventFirers[eventName] = (payload) => {
      for (const listener of listeners) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        listener(payload);
      }
    };
  }

  return { stub: stubCopy, eventFirers };
};

export const subscribeToEvent = <TEvent extends vscode.Event<unknown>>(event: TEvent) => {
  type Listener = Parameters<TEvent>[0];
  type Args = Parameters<Listener>;

  const calls: Args[] = [];

  event((...args) => {
    calls.push(args as Args);
  });

  return calls;
};

export const createAccountStub = (props: Partial<IAccount> = {}): IAccount => ({
  accountKey: {
    providerId: "providerId",
    accountId: "accountId",
  },
  isRepoForAccount: sinon.stub(),
  ...props,
});

export const createUserStub = (props: Partial<User> = {}): User => ({
  email: "jane@doe.com",
  name: "Jane Doe",
  login: "janedoe",
  ...props,
});

export const createRemoteRepositoryStub = (props: Partial<IRemoteRepository> = {}): IRemoteRepository => ({
  account: createAccountStub(),
  remoteUrl: "remoteUrl",
  repoId: {
    owner: "owner",
    repo: "repo",
  },
  getPullRequestList: sinon.stub(),
  getPullRequest: sinon.stub(),
  getIssueComments: sinon.stub(),
  getPullRequestReviewComments: sinon.stub(),
  getPullRequestFiles: sinon.stub(),
  getPullRequestCommits: sinon.stub(),
  getCommitFiles: sinon.stub(),
  getCommitComments: sinon.stub(),
  onDidChangeIssueComments: sinon.stub(),
  onDidChangePullRequestReviewComments: sinon.stub(),
  dispose: sinon.stub(),
  ...props,
});

export const createLocalRepositoryStub = (props: Partial<ILocalGitRepository> = {}): ILocalGitRepository => ({
  workspaceFolder: createWorkspaceFolderStub(),
  path: "path/to/repo",
  getFileAtCommit: sinon.stub(),
  getBranchCommitsAheadOf: sinon.stub(),
  getBranchCommits: sinon.stub(),
  getBranchStatus: sinon.stub(),
  getCurrentBranch: sinon.stub(),
  getCurrentCommit: sinon.stub(),
  getCommitsForPullRequest: sinon.stub(),
  getCommitFiles: sinon.stub(),
  getParentCommit: sinon.stub(),
  ...props,
});

// @ts-expect-error Partial stub.
export const createGitExtensionRepositoryStub = (props: Partial<GitExtensionRepository> = {}): GitExtensionRepository => ({
  rootUri: vscode.Uri.parse("file:///workspace"),
  ...props,
});

export const createRepositoryStub = (props: Partial<IRepository> = {}): IRepository => ({
  repoId: { owner: "owner", repo: "repo" },
  remoteRepository: createRemoteRepositoryStub(),
  localRepository: createLocalRepositoryStub(),
  dispose: sinon.stub(),
  ...props,
});

export const createPullRequestGitRefStub = (props: Partial<PullRequestGitRef> = {}): PullRequestGitRef => ({
  sha: "sha",
  ref: "ref",
  owner: "owner",
  repo: "repo",
  ...props,
});

export const createPullRequestStub = (props: Partial<PullRequest> = {}): PullRequest => ({
  id: 1,
  number: 1,
  title: "title",
  state: "open",
  createdAt: new Date(),
  updatedAt: new Date(),
  closedAt: null,
  mergedAt: null,
  isDraft: false,
  repository: {
    name: "name",
    owner: "owner",
    url: "url",
  },
  url: "url",
  user: createUserStub(),
  base: createPullRequestGitRefStub(),
  head: createPullRequestGitRefStub(),
  ...props,
});

export const createFileStub = (props: Partial<CommitFile> = {}): CommitFile => ({
  filename: "filename",
  status: "U",
  sha: "sha",
  additions: 0,
  deletions: 0,
  changes: 0,
  patch: "patch",
  blobUrl: "blobUrl",
  contentsUrl: "contentsUrl",
  rawUrl: "rawUrl",
  ...props,
});

export const createIssueCommentStub = (props: Partial<IssueComment> = {}): IssueComment => ({
  id: 1,
  body: "body",
  createdAt: new Date(),
  updatedAt: new Date(),
  replyTo: null,
  user: createUserStub(),
  ...props,
});

export const createPullRequestCommentStub = (props: Partial<PullRequestComment> = {}): PullRequestComment => ({
  ...createIssueCommentStub(props),
  path: "path",
  startLine: null,
  originalStartLine: null,
  startSide: null,
  line: null,
  originalLine: null,
  side: null,
  ...props,
});

export const createCommitStub = (props: Partial<Commit> = {}): Commit => ({
  sha: "sha",
  commit: {
    author: createUserStub(),
    committer: createUserStub(),
    message: "message",
    commentCount: 0,
    tree: {
      sha: "tree-sha",
      url: "tree-url",
    },
    ...(props.commit ?? {}),
  },
  stats: {
    total: 0,
    additions: 0,
    deletions: 0,
    ...(props.stats ?? {}),
  },
  url: "commit-url",
  ...props,
});

export const createCommitCommentStub = (props: Partial<CommitComment> = {}): CommitComment => ({
  id: 1,
  body: "commit comment body",
  createdAt: new Date(),
  updatedAt: new Date(),
  user: createUserStub(),
  path: null,
  position: null,
  line: null,
  ...props,
});

export const createAccountManagerStub = (props: Partial<IAccountManager> = {}): IAccountManager => ({
  getAccountByProviderId: sinon.stub(),
  getAllAccounts: sinon.stub(),
  ...props,
});

export const createWorkspaceFolderStub = (props: Partial<vscode.WorkspaceFolder> = {}): vscode.WorkspaceFolder => ({
  uri: vscode.Uri.parse("file:///workspace"),
  name: "workspace",
  index: 0,
  ...props,
});

export const createApiCacheStub = (props: Partial<IApiCache> = {}): IApiCache => ({
  get: sinon.stub(),
  set: sinon.stub(),
  clear: sinon.stub(),
  invalidate: sinon.stub(),
  ...props,
});

export const createFileCacheStub = (props: Partial<IFileCache> = {}): IFileCache => ({
  get: sinon.stub(),
  set: sinon.stub(),
  invalidate: sinon.stub(),
  clear: sinon.stub(),
  ...props,
});

export const createTreeNodeProviderStub = (props: Partial<ITreeNodeProvider<ITreeNode>> = {}): ITreeNodeProvider<ITreeNode> => ({
  getChildren: sinon.stub(),
  getTreeItem: sinon.stub(),
  refresh: sinon.stub(),
  onDidChangeTreeData: sinon.stub(),
  ...props,
});

export const createPullRequestContentsProviderStub = (props: Partial<PullRequestContentsProvider> = {}): PullRequestContentsProvider =>
  ({
    getChildren: sinon.stub(),
    getTreeItem: sinon.stub(),
    refresh: sinon.stub(),
    onDidChangeTreeData: sinon.stub(),
    openPullRequest: sinon.stub(),
    dispose: sinon.stub(),
    ...props,
  }) as PullRequestContentsProvider;

export const createRepositoryManagerStub = (props: Partial<IRepositoryManager> = {}): IRepositoryManager => ({
  refresh: sinon.stub(),
  getAllRepositories: sinon.stub(),
  getRepository: sinon.stub(),
  dispose: sinon.stub(),
  onRepositoryStateChanged: sinon.stub(),
  getRepositoryById: sinon.stub(),
  ...props,
});

export const createTreeDecorationManagerStub = (props: Partial<ITreeDecorationManager> = {}): ITreeDecorationManager => ({
  registerProviders: sinon.stub(),
  updateListeners: sinon.stub(),
  dispose: sinon.stub(),
  ...props,
});

export const createGitManagerStub = (props: Partial<IGitManager> = {}): IGitManager => ({
  getGitExtensionRepository: sinon.stub(),
  ...props,
});

export const createCommandManagerStub = (props: Partial<ICommandManager> = {}): ICommandManager => ({
  executeCommand: sinon.stub() as unknown as ICommandManager["executeCommand"],
  createCommand: sinon.stub() as unknown as ICommandManager["createCommand"],
  dispose: sinon.stub(),
  ...props,
});

export const createKeaContextStub = (props: Partial<IKeaContext> = {}): IKeaContext => ({
  accountManager: createAccountManagerStub(),
  commandManager: createCommandManagerStub(),
  gitManager: createGitManagerStub(),
  repositoryManager: createRepositoryManagerStub(),
  treeDecorationManager: createTreeDecorationManagerStub(),
  apiCache: createApiCacheStub(),
  fileCache: createFileCacheStub(),
  pullRequestListTree: {
    treeViewProvider: createTreeNodeProviderStub() as PullRequestListTreeProvider,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    treeView: {} as vscode.TreeView<any>,
  },
  pullRequestContents: {
    treeViewProvider: createPullRequestContentsProviderStub(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    treeView: {} as vscode.TreeView<any>,
  },
  dispose: sinon.stub(),
  ...props,
});

export const assertArrayContentsEqual = <T>(arr1: T[], arr2: T[]): void => {
  assert.strictEqual(arr1.length, arr2.length, `Arrays have different lengths: ${arr1.length} !== ${arr2.length}`);

  for (let i = 0; i < arr1.length; i++) {
    assert.equal(arr1[i], arr2[i], `Elements at index ${i} are different`);
  }
};
