import sinon from "sinon";
import { IAccount } from "./account/account";
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
  ...props,
});

export const createPullRequestFileStub = (props: Partial<PullRequestFile> = {}): PullRequestFile => ({
  filename: "filename",
  status: "status",
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
  startLine: null,
  originalStartLine: null,
  startSide: null,
  line: null,
  originalLine: null,
  side: null,
  ...props,
});
