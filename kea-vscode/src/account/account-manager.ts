import { AuthenticationSessionsChangeEvent } from "vscode";
import { GitHubAccount } from "./github/github-account";

export interface IAccountManager {
  getAllAccounts: () => Promise<Array<GitHubAccount | Error>>;
  getAccountBySessionId: (sessionId: string) => Promise<GitHubAccount | Error>;
  onDidChangeSessionsListener: (e: AuthenticationSessionsChangeEvent) => Promise<void>;
}

export class AccountManager implements IAccountManager {
  #gitHubAccount: GitHubAccount | undefined;

  #getGitHubAccount = async (): Promise<GitHubAccount | Error> => {
    if (this.#gitHubAccount) {
      return Promise.resolve(this.#gitHubAccount);
    }

    const account = await GitHubAccount.create();
    if (account instanceof Error) {
      return account;
    }
    this.#gitHubAccount = account;
    return account;
  };

  getAllAccounts = async (): Promise<Array<GitHubAccount | Error>> => {
    const account = await this.#getGitHubAccount();
    if (account instanceof Error) {
      return [account];
    }

    return [account];
  };

  getAccountBySessionId = async (sessionId: string): Promise<GitHubAccount | Error> => {
    const account = await this.#getGitHubAccount();
    if (account instanceof Error) {
      return account;
    }

    if (account.session.id === sessionId) {
      return account;
    }

    return new Error("No account found for session ID");
  };

  onDidChangeSessionsListener = async (e: AuthenticationSessionsChangeEvent): Promise<void> => {
    if (e.provider.id === GitHubAccount.providerId) {
      this.#gitHubAccount = undefined;

      const account = await this.#getGitHubAccount();

      if (account instanceof Error) {
        console.error(`Error creating GitHub account: ${account.message}`);
        return;
      }

      this.#gitHubAccount = account;
      console.info(`GitHub account created: ${account.session.id}`);
    }
  };
}
