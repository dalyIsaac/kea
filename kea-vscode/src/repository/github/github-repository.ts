import { Endpoints, RequestParameters, Route } from "@octokit/types";
import * as vscode from "vscode";
import { GitHubAccount } from "../../account/github/github-account";
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
  account: GitHubAccount;
  remoteUrl: string;
  repoId: RepoId;
  #cache: ICache;

  constructor(remoteUrl: string, repoId: RepoId, account: GitHubAccount, cache: ICache) {
    this.remoteUrl = remoteUrl;
    this.repoId = repoId;
    this.account = account;
    this.#cache = cache;
  }

  /**
   * Returns the octokit instance for this repository.
   * @param route The route to request.
   * @param options The options to pass to the request.
   * @param forceRequest If true, the request will be made even if the result is cached.
   * @throws Error if the octokit instance cannot be created, or if the request fails.
   * @returns The response data from the request.
   */
  #request = async <R extends Route>(
    route: keyof Endpoints | R,
    options?: R extends keyof Endpoints ? Endpoints[R]["parameters"] & RequestParameters : never,
    forceRequest?: boolean,
  ): Promise<R extends keyof Endpoints ? Endpoints[R]["response"]["data"] : never> => {
    type RequestResult = R extends keyof Endpoints ? Endpoints[R]["response"] : never;

    const cacheKey = this.#cache.generateKey(route, options);
    const cachedResult = this.#cache.get(cacheKey);

    if (forceRequest !== true) {
      if (cachedResult !== undefined && cachedResult !== null) {
        return cachedResult as RequestResult;
      }
    }

    const octokit = await this.account.getOctokit();
    if (octokit instanceof Error) {
      // We throw the error so that the caller can handle it.
      // eslint-disable-next-line no-restricted-syntax
      throw octokit;
    }

    const previousHeaders = this.#cache.getHeaders(cacheKey);
    const requestOptions = {
      ...options,
      headers: {
        ...options?.headers,
        ...(previousHeaders?.etag ? { "If-None-Match": previousHeaders.etag } : {}),
        ...(previousHeaders?.lastModified ? { "If-Modified-Since": previousHeaders.lastModified } : {}),
      },
    } as typeof options;

    Logger.info(`Fetching ${route} with options:`, requestOptions);

    const fetchedResult = await octokit.request(route, requestOptions);

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
