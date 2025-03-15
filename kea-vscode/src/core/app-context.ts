import { AuthenticationSessionsChangeEvent } from "vscode";
import { GitHubAccount } from "../account/github/github-account";
import { Logger } from "./logger";

export const AppContext = new (class AppContext {
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

  getAccount = async (_accountName: string): Promise<GitHubAccount | Error> => {
    // TODO: Create an account manager to handle multiple accounts.
    return this.#getGitHubAccount();
  };

  onDidChangeSessionsListener = async (e: AuthenticationSessionsChangeEvent): Promise<void> => {
    if (e.provider.id === GitHubAccount.providerId) {
      this.#gitHubAccount = undefined;

      const account = await this.#getGitHubAccount();

      if (account instanceof Error) {
        Logger.error(`Error creating GitHub account: ${account.message}`);
        return;
      }

      this.#gitHubAccount = account;
      Logger.info(`GitHub account created: ${account.session.id}`);
    }
  };
})();
