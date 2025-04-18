/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon from "sinon";
import * as vscode from "vscode";
import { IAccount } from "./account/account";
import { IAccountManager } from "./account/account-manager";
import { ILruApiCache } from "./lru-cache/lru-api-cache";
import { IKeaRepository } from "./repository/kea-repository";
import { File, IssueComment, PullRequest, PullRequestComment } from "./types/kea";
import { ITreeNodeProvider } from "./views/pull-request-list/tree-node-provider";
import { ITreeNode } from "./views/tree-node";

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
  onDidChangeIssueComments: sinon.stub(),
  onDidChangePullRequestReviewComments: sinon.stub(),
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
  user: {
    login: "login",
    avatarUrl: "avatarUrl",
  },
  ...props,
});

export const createFileStub = (props: Partial<File> = {}): File => ({
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
  user: {
    login: "login",
    avatarUrl: "avatarUrl",
  },
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

export const createCacheStub = (props: Partial<ILruApiCache> = {}): ILruApiCache => ({
  get: sinon.stub(),
  set: sinon.stub(),
  clear: sinon.stub(),
  invalidate: sinon.stub(),
  ...props,
});

export const createTreeNodeProviderStub = (props: Partial<ITreeNodeProvider<ITreeNode>> = {}): ITreeNodeProvider<ITreeNode> => ({
  getChildren: sinon.stub(),
  getTreeItem: sinon.stub(),
  refresh: sinon.stub(),
  onDidChangeTreeData: sinon.stub(),
  ...props,
});
