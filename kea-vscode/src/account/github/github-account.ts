import { Octokit } from "@octokit/rest";
import * as vscode from "vscode";
import { AuthenticationSession } from "vscode";
import { PullRequest, PullRequestComment, PullRequestId, RepoId } from "../../types/kea";
import { IAccount } from "../account";
import { convertGitHubPullRequest, convertGitHubPullRequestComment } from "./github-utils";

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

  static isGitHubUrl = (url: string): boolean => {
    return url.includes("github.com");
  };

  getPullRequestList = async (repoId: RepoId): Promise<PullRequest[] | Error> => {
    try {
      const response = await this.#octokit.pulls.list({
        owner: repoId.owner,
        repo: repoId.repo,
        state: "open",
        sort: "updated",
        direction: "desc",
        per_page: 100,
      });

      return response.data.map(convertGitHubPullRequest);
    } catch (error) {
      return new Error(`Error fetching pull requests: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  getPullRequestComments = async (pullId: PullRequestId): Promise<PullRequestComment[] | Error> => {
    try {
      const response = await this.#octokit.pulls.listReviewComments({
        owner: pullId.owner,
        repo: pullId.repo,
        pull_number: pullId.number,
      });

      return response.data.map(convertGitHubPullRequestComment);
    } catch (error) {
      return new Error(`Error fetching pull request comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
