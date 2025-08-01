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
import { IKeaRepository } from "./repository/kea-repository";
import { IRepositoryManager } from "./repository/repository-manager";
import { Commit, CommitComment, CommitFile, IssueComment, PullRequest, PullRequestComment, PullRequestGitRef, User } from "./types/kea";
import { PullRequestContentsProvider } from "./views/pull-request-contents/pull-request-contents-provider";
import { PullRequestListTreeProvider } from "./views/pull-request-list/pull-request-list-tree-provider";
import { ITreeNode } from "./views/tree-node";
import { ITreeNodeProvider } from "./views/tree-node-provider";

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

export const createAccountStub = (props: Partial<IAccount> = {}): IAccount => ({
  accountKey: {
    providerId: "providerId",
    accountId: "accountId",
  },
  isRepoForAccount: sinon.stub(),
  tryCreateRepoForAccount: sinon.stub(),
  ...props,
});

export const createUserStub = (props: Partial<User> = {}): User => ({
  email: "jane@doe.com",
  name: "Jane Doe",
  login: "janedoe",
  ...props,
});

export const createRepositoryStub = (props: Partial<IKeaRepository> = {}): IKeaRepository => ({
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
  status: "unchanged",
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

export const createRepositoryManagerStub = (props: Partial<IRepositoryManager> = {}): IRepositoryManager => ({
  addRepository: sinon.stub(),
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
  getAllRepositoriesAndInfo: sinon.stub(),
  getRepositoryInfo: sinon.stub(),
  getGitRepository: sinon.stub(),
  getGitBranchForRepository: sinon.stub(),
  onRepositoryStateChanged: sinon.stub(),
  dispose: sinon.stub(),
  ...props,
});

export const createCommandManagerStub = (props: Partial<ICommandManager> = {}): ICommandManager => ({
  executeCommand: sinon.stub() as unknown as ICommandManager["executeCommand"],
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
    treeViewProvider: createTreeNodeProviderStub() as PullRequestContentsProvider,
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
