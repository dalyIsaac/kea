import { Octokit } from "@octokit/rest";
import * as vscode from "vscode";
import { ICache } from "../../core/cache";
import { GitHubRepository } from "../../repository/github/github-repository";
import { IKeaRepository } from "../../repository/kea-repository";
import { IAccount } from "../account";

export const GITHUB_PROVIDER_ID = "github";

export class GitHubAccount implements IAccount {
  static #scopes = ["user:email", "repo", "read:org"];
  static #hasRequestedUser = false;

  providerId = GITHUB_PROVIDER_ID;
  accountId: string;

  private constructor(accountId: string) {
    this.accountId = accountId;
  }

  getOctokit = async (): Promise<Octokit | Error> => {
    const session = await vscode.authentication.getSession(this.providerId, GitHubAccount.#scopes);
    if (session === undefined) {
      return new Error("No GitHub session found");
    }

    return new Octokit({
      auth: session.accessToken,
      userAgent: "Kea",
      baseUrl: "https://api.github.com",
    });
  };

  static create = async (): Promise<GitHubAccount | Error> => {
    const session = await vscode.authentication.getSession(GITHUB_PROVIDER_ID, this.#scopes);

    if (session === undefined) {
      if (!this.#hasRequestedUser) {
        this.#hasRequestedUser = true;
        vscode.window.showInformationMessage("Please authorize Kea to access your GitHub account");
      }

      return new Error("No GitHub session found");
    }

    return new GitHubAccount(session.account.id);
  };

  isRepoForAccount = (repoUrl: string): boolean => repoUrl.includes("github.com");

  tryCreateRepoForAccount = (repoUrl: string, cache: ICache): IKeaRepository | Error => {
    if (!this.isRepoForAccount(repoUrl)) {
      return new Error("Not a GitHub repository URL");
    }

    const [owner, repoName] = repoUrl.replace(".git", "").split("/").slice(-2);
    if (owner === undefined || repoName === undefined) {
      return new Error("Expected to find owner and repo name in URL");
    }

    return new GitHubRepository(repoUrl, { owner, repo: repoName }, this, cache);
  };
}
