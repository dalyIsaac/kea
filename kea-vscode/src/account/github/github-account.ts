import { Octokit } from "@octokit/rest";
import * as vscode from "vscode";
import { AuthenticationSession } from "vscode";
import { GitHubRepository } from "../../repository/github/github-repository";
import { IKeaRepository } from "../../repository/kea-repository";
import { IAccount } from "../account";

export class GitHubAccount implements IAccount {
  static providerId = "github";
  static #scopes = ["user:email", "repo", "read:org"];
  static #hasRequestedUser = false;

  session: AuthenticationSession;
  #octokit: Octokit;

  private constructor(session: AuthenticationSession) {
    this.session = session;
    this.#octokit = new Octokit({
      auth: session.accessToken,
    });
  }

  static create = async (): Promise<GitHubAccount | Error> => {
    const session = await vscode.authentication.getSession(this.providerId, this.#scopes);

    if (session === undefined) {
      if (!this.#hasRequestedUser) {
        this.#hasRequestedUser = true;
        vscode.window.showInformationMessage("Please authorize Kea to access your GitHub account");
      }

      return new Error("No GitHub session found");
    }

    return new GitHubAccount(session);
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

    return new GitHubRepository(this.session.account.id, repoUrl, { owner, repo: repoName }, this.#octokit);
  };
}
