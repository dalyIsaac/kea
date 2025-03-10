import { Octokit } from "octokit";
import * as vscode from "vscode";
import { AuthenticationSession } from "vscode";
import { IAccount } from "./account";

export interface GitHubUser {
  login: string;
  id: number;
  name: string | null;
  avatarUrl: string;
  email: string | null;
}

export class GitHubAccount implements IAccount {
  static providerId = "github";
  static #scopes = ["user:email", "repo", "read:org"];
  static #hasRequestedUser = false;

  session: AuthenticationSession;
  #octokit: Octokit;
  #user: GitHubUser | null = null;

  private constructor(session: AuthenticationSession) {
    this.session = session;
    this.#octokit = new Octokit({ auth: session.accessToken });
  }

  static create = async (): Promise<GitHubAccount | Error> => {
    const session = await vscode.authentication.getSession(this.providerId, [
      "user:email",
      "repo",
      "read:org",
    ]);

    if (session === undefined) {
      if (!this.#hasRequestedUser) {
        this.#hasRequestedUser = true;
        vscode.window.showInformationMessage("Please authorize Kea to access your GitHub account");
      }

      return new Error("No GitHub session found");
    }

    return new GitHubAccount(session);
  };

  static isGitHubUrl = (url: string): boolean => {
    return url.includes("github.com");
  };

  getUserProfile = async (): Promise<GitHubUser | Error> => {
    if (this.#user) {
      return this.#user;
    }

    try {
      const { data } = await this.#octokit.rest.users.getAuthenticated();

      this.#user = {
        login: data.login,
        id: data.id,
        name: data.name,
        avatarUrl: data.avatar_url,
        email: data.email,
      };

      return this.#user;
    } catch (error) {
      return new Error(`Failed to fetch GitHub user profile: ${error}`);
    }
  };
}
