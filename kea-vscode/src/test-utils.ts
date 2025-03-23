/* eslint-disable @typescript-eslint/no-explicit-any */
import sinon from "sinon";
import { IAccount } from "./account/account";
import { IKeaRepository } from "./repository/kea-repository";
import { IssueComment, PullRequestComment, PullRequestFile } from "./types/kea";

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
  isRepoForAccount: sinon.stub(),
  session: {
    accessToken: "accessToken",
    account: {
      id: "accountId",
      label: "accountLabel",
    },
    scopes: ["repo"],
    id: "sessionId",
  },
  tryCreateRepoForAccount: sinon.stub(),
  ...props,
});

export const createRepositoryStub = (props: Partial<IKeaRepository> = {}): IKeaRepository => ({
  authSessionAccountId: "accountId",
  remoteUrl: "remoteUrl",
  repoId: {
    owner: "owner",
    repo: "repo",
  },
  getPullRequestList: sinon.stub(),
  getIssueComments: sinon.stub(),
  getPullRequestReviewComments: sinon.stub(),
  getPullRequestFiles: sinon.stub(),
  onDidChangeIssueComments: sinon.stub(),
  onDidChangePullRequestReviewComments: sinon.stub(),
  ...props,
});

export const createPullRequestFileStub = (props: Partial<PullRequestFile> = {}): PullRequestFile => ({
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
