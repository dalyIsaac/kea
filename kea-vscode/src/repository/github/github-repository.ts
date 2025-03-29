import { Octokit } from "@octokit/rest";
import { Endpoints, OctokitResponse, RequestParameters, Route } from "@octokit/types";
import * as vscode from "vscode";
import {
  convertGitHubIssueComment,
  convertGitHubPullRequest,
  convertGitHubPullRequestFile,
  convertGitHubPullRequestReviewComment,
} from "../../account/github/github-utils";
import { ICache } from "../../core/cache";
import { Logger } from "../../core/logger";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestFile, PullRequestId, RepoId } from "../../types/kea";
import { IKeaRepository, IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../kea-repository";

export class GitHubRepository implements IKeaRepository {
  authSessionAccountId: string;
  remoteUrl: string;
  repoId: RepoId;
  #octokit: Octokit;
  #cache: ICache;

  constructor(authSessionAccountId: string, remoteUrl: string, repoId: RepoId, octokit: Octokit, cache: ICache) {
    this.authSessionAccountId = authSessionAccountId;
    this.remoteUrl = remoteUrl;
    this.repoId = repoId;
    this.#octokit = octokit;
    this.#cache = cache;
  }

  #request = async <R extends Route>(
    route: keyof Endpoints | R,
    options?: R extends keyof Endpoints ? Endpoints[R]["parameters"] & RequestParameters : RequestParameters,
    forceRequest?: boolean,
  ): Promise<R extends keyof Endpoints ? Endpoints[R]["response"]["data"] : OctokitResponse<unknown>> => {
    type RequestResult = R extends keyof Endpoints ? Endpoints[R]["response"] : OctokitResponse<unknown>;

    const cacheKey = this.#cache.generateKey(route, options);
    const cachedResult = this.#cache.get(cacheKey);

    if (forceRequest !== true) {
      if (cachedResult !== undefined && cachedResult !== null) {
        return cachedResult as RequestResult;
      }
    }

    Logger.info(`Fetching ${route} with options:`, options);
    const fetchedResult = await this.#octokit.request(route, options);

    const resultHeaders = {
      etag: fetchedResult.headers.etag,
      lastModified: fetchedResult.headers["last-modified"],
    };
    this.#cache.set(cacheKey, fetchedResult.data, resultHeaders);
    return fetchedResult.data as RequestResult;
  };

  getPullRequestList = async (forceRequest?: boolean): Promise<PullRequest[] | Error> => {
    try {
      const response = await this.#request(
        "GET /repos/{owner}/{repo}/pulls",
        {
          owner: this.repoId.owner,
          repo: this.repoId.repo,
          state: "open",
          sort: "updated",
          direction: "desc",
          per_page: 100,
        },
        forceRequest,
      );

      return response.map(convertGitHubPullRequest);
    } catch (error) {
      return new Error(`Error fetching pull requests: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  getIssueComments = async (issueId: IssueId, forceRequest?: boolean): Promise<IssueComment[] | Error> => {
    let result: IssueComment[] | Error;
    try {
      const response = await this.#request(
        "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner: issueId.owner,
          repo: issueId.repo,
          issue_number: issueId.number,
        },
        forceRequest,
      );

      result = response.map(convertGitHubIssueComment);
    } catch (error) {
      result = new Error(`Error fetching issue comments: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.#onDidChangeIssueComments.fire({ issueId, comments: result });
    return result;
  };

  getPullRequestReviewComments = async (pullId: PullRequestId, forceRequest?: boolean): Promise<PullRequestComment[] | Error> => {
    let result: PullRequestComment[] | Error;
    try {
      const response = await this.#request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
        {
          owner: pullId.owner,
          repo: pullId.repo,
          pull_number: pullId.number,
        },
        forceRequest,
      );

      result = response.map(convertGitHubPullRequestReviewComment);
    } catch (error) {
      result = new Error(`Error fetching pull request comments: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.#onDidChangePullRequestReviewComments.fire({ pullId, comments: result });
    return result;
  };

  getPullRequestFiles = async (pullId: PullRequestId, forceRequest?: boolean): Promise<PullRequestFile[] | Error> => {
    try {
      const response = await this.#request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
        {
          owner: pullId.owner,
          repo: pullId.repo,
          pull_number: pullId.number,
        },
        forceRequest,
      );

      return response.map(convertGitHubPullRequestFile);
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
