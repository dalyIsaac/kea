import { IKeaContext } from "../core/context";
import { IAccount } from "./account";
import { GITHUB_PROVIDER_ID, GitHubAccount } from "./github/github-account";

export interface IAccountManager {
  getAllAccounts: () => Promise<Array<IAccount | Error>>;
  getAccountByProviderId: (providerId: string) => Promise<IAccount | Error>;
}

export class AccountManager implements IAccountManager {
  readonly #ctx: IKeaContext;
  #gitHubAccount: IAccount | undefined;

  constructor(ctx: IKeaContext) {
    this.#ctx = ctx;
  }

  #getGitHubAccount = async (): Promise<IAccount | Error> => {
    if (this.#gitHubAccount) {
      return Promise.resolve(this.#gitHubAccount);
    }

    const account = await GitHubAccount.create(this.#ctx);
    if (account instanceof Error) {
      return account;
    }
    this.#gitHubAccount = account;
    return account;
  };

  getAllAccounts = async (): Promise<Array<IAccount | Error>> => {
    const account = await this.#getGitHubAccount();
    if (account instanceof Error) {
      return [account];
    }

    return [account];
  };

  getAccountByProviderId = async (providerId: string): Promise<IAccount | Error> => {
    if (providerId === GITHUB_PROVIDER_ID) {
      return this.#getGitHubAccount();
    }

    return new Error(`No account found for provider ID: ${providerId}`);
  };
}
