import { Octokit } from "@octokit/rest";
import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";
import { GitHubRepository } from "../../repository/github/github-repository";
import { IKeaRepository } from "../../repository/kea-repository";
import { IAccount, IAccountKey } from "../account";

export const GITHUB_PROVIDER_ID = "github";

export class GitHubAccount implements IAccount {
  static #scopes = ["user:email", "repo", "read:org"];
  static #hasRequestedUser = false;

  readonly #ctx: IKeaContext;
  readonly #repositories = new Map<string, IKeaRepository>();

  accountKey: IAccountKey;

  private constructor(ctx: IKeaContext, accountId: string) {
    this.#ctx = ctx;
    this.accountKey = {
      providerId: GITHUB_PROVIDER_ID,
      accountId,
    };
  }

  getOctokit = async (): Promise<Octokit | Error> => {
    const session = await vscode.authentication.getSession(this.accountKey.providerId, GitHubAccount.#scopes);
    if (session === undefined) {
      return new Error("No GitHub session found");
    }

    return new Octokit({
      auth: session.accessToken,
      userAgent: "Kea",
      baseUrl: "https://api.github.com",
    });
  };

  static create = async (ctx: IKeaContext): Promise<GitHubAccount | Error> => {
    const session = await vscode.authentication.getSession(GITHUB_PROVIDER_ID, this.#scopes);

    if (session === undefined) {
      if (!this.#hasRequestedUser) {
        this.#hasRequestedUser = true;
        vscode.window.showInformationMessage("Please authorize Kea to access your GitHub account");
      }

      return new Error("No GitHub session found");
    }

    return new GitHubAccount(ctx, session.account.id);
  };

  isRepoForAccount = (repoUrl: string): boolean => repoUrl.includes("github.com");

  tryCreateRepoForAccount = (repoUrl: string): IKeaRepository | Error => {
    if (!this.isRepoForAccount(repoUrl)) {
      return new Error("Not a GitHub repository URL");
    }

    const [owner, repoName] = repoUrl.replace(".git", "").split("/").slice(-2);
    if (owner === undefined || repoName === undefined) {
      return new Error("Expected to find owner and repo name in URL");
    }

    let repo = this.#repositories.get(repoUrl);
    if (repo !== undefined) {
      return repo;
    }

    repo = new GitHubRepository(repoUrl, { owner, repo: repoName }, this, this.#ctx);
    this.#repositories.set(repoUrl, repo);
    return repo;
  };
}
