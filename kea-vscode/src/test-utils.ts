import sinon from "sinon";
import { IAccount } from "./account/account";

export const createAccountStub = (props: Partial<IAccount> = {}): IAccount => ({
  getIssueComments: sinon.stub(),
  getPullRequestFiles: sinon.stub(),
  getPullRequestList: sinon.stub(),
  getPullRequestReviewComments: sinon.stub(),
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
