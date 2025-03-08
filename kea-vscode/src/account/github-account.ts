import * as vscode from "vscode";
import { AuthenticationSession } from "vscode";
import { IAccount } from "./account";

export class GitHubAccount implements IAccount {
  static #providerId = "github";
  session: AuthenticationSession;

  private constructor(session: AuthenticationSession) {
    this.session = session;
  }

  static create = async (): Promise<GitHubAccount | undefined> => {
    const session = await vscode.authentication.getSession(this.#providerId, [
      "user:email",
      "repo",
      "read:org",
    ]);

    return session ? new GitHubAccount(session) : undefined;
  };
}
