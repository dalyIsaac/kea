import * as vscode from "vscode";
import { AuthenticationSession } from "vscode";
import { IAccount } from "./account";

export class GitHubAccount implements IAccount {
  static providerId = "github";
  static #scopes = ["user:email", "repo", "read:org"];
  static #hasRequestedUser = false;

  session: AuthenticationSession;

  private constructor(session: AuthenticationSession) {
    this.session = session;
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
}
