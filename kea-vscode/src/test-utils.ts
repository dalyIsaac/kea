import sinon from "sinon";
import { IAccount } from "./account/account";
import { IKeaRepository } from "./repository/kea-repository";
import { IssueComment, PullRequestComment, PullRequestFile } from "./types/kea";

export const createAccountStub = (props: Partial<IAccount> = {}): IAccount => ({
  getIssueComments: sinon.stub(),
  getPullRequestFiles: sinon.stub(),
  getPullRequestList: sinon.stub(),
  getPullRequestReviewComments: sinon.stub(),
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
