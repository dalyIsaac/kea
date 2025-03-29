import { Octokit } from "@octokit/rest";
import * as vscode from "vscode";
import {
  convertGitHubIssueComment,
  convertGitHubPullRequest,
  convertGitHubPullRequestFile,
  convertGitHubPullRequestReviewComment,
} from "../../account/github/github-utils";
import { Cache } from "../../core/cache";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestFile, PullRequestId, RepoId } from "../../types/kea";
import { IKeaRepository, IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../kea-repository";

export class GitHubRepository implements IKeaRepository {
  authSessionAccountId: string;
  remoteUrl: string;
  repoId: RepoId;
  #octokit: Octokit;
  #cache: Cache;

  constructor(authSessionAccountId: string, remoteUrl: string, repoId: RepoId, octokit: Octokit, cache: Cache) {
    this.authSessionAccountId = authSessionAccountId;
    this.remoteUrl = remoteUrl;
    this.repoId = repoId;
    this.#octokit = octokit;
    this.#cache = cache;
  }

  // @ts-expect-error We're not fully implementing the request method.
  #query: Octokit["request"] = async (route, options) => {
    const cacheKey = this.#cache.generateKey(route, options);
    const cachedResult = this.#cache.get(cacheKey);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const fetchedResult = await this.#octokit.request(route, options);
    const headers = {
      etag: fetchedResult.headers.etag,
      lastModified: fetchedResult.headers["last-modified"],
    };
    this.#cache.set(cacheKey, fetchedResult.data, headers);
    return fetchedResult.data;
  };

  getPullRequestList = async (): Promise<PullRequest[] | Error> => {
    try {
      const response = await this.#query("GET /repos/{owner}/{repo}/pulls", {
        owner: this.repoId.owner,
        repo: this.repoId.repo,
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

  getIssueComments = async (issueId: IssueId): Promise<IssueComment[] | Error> => {
    let result: IssueComment[] | Error;
    try {
      const response = await this.#query("GET /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner: issueId.owner,
        repo: issueId.repo,
        issue_number: issueId.number,
      });

      result = response.data.map(convertGitHubIssueComment);
    } catch (error) {
      result = new Error(`Error fetching issue comments: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.#onDidChangeIssueComments.fire({ issueId, comments: result });
    return result;
  };

  getPullRequestReviewComments = async (pullId: PullRequestId): Promise<PullRequestComment[] | Error> => {
    let result: PullRequestComment[] | Error;
    try {
      const response = await this.#query("GET /repos/{owner}/{repo}/pulls/{pull_number}/comments", {
        owner: pullId.owner,
        repo: pullId.repo,
        pull_number: pullId.number,
      });

      result = response.data.map(convertGitHubPullRequestReviewComment);
    } catch (error) {
      result = new Error(`Error fetching pull request comments: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.#onDidChangePullRequestReviewComments.fire({ pullId, comments: result });
    return result;
  };

  getPullRequestFiles = async (pullId: PullRequestId): Promise<PullRequestFile[] | Error> => {
    try {
      const response = await this.#query("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
        owner: pullId.owner,
        repo: pullId.repo,
        pull_number: pullId.number,
      });

      return response.data.map(convertGitHubPullRequestFile);
    } catch (error) {
      return new Error(`Error fetching pull request files: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  #onDidChangeIssueComments: vscode.EventEmitter<IssueCommentsPayload> = new vscode.EventEmitter<IssueCommentsPayload>();
  onDidChangeIssueComments = this.#onDidChangeIssueComments.event;

  #onDidChangePullRequestReviewComments: vscode.EventEmitter<PullRequestReviewCommentsPayload> =
    new vscode.EventEmitter<PullRequestReviewCommentsPayload>();
  onDidChangePullRequestReviewComments = this.#onDidChangePullRequestReviewComments.event;
}
