import { AuthenticationSession } from "vscode";
import { IProvider } from "./provider";
import { vscode } from "../aliases";

export class GitHubProvider implements IProvider {
  static #providerId = "github";
  session: AuthenticationSession;

  private constructor(session: AuthenticationSession) {
    this.session = session;
  }

  static create = async (): Promise<GitHubProvider | undefined> => {
    const session = await vscode.authentication.getSession(this.#providerId, [
      "user:email",
      "repo",
      "read:org",
    ]);

    return session ? new GitHubProvider(session) : undefined;
  };
}
