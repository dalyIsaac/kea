import { Endpoints, RequestParameters, Route } from "@octokit/types";
import * as vscode from "vscode";
import { GitHubAccount } from "../../account/github/github-account";
import {
  convertGitHubIssueComment,
  convertGitHubPullRequest,
  convertGitHubPullRequestFile,
  convertGitHubPullRequestListItem,
  convertGitHubPullRequestReviewComment,
} from "../../account/github/github-utils";
import { Logger } from "../../core/logger";
import { CacheKey, isMethod } from "../../lru-cache/cache-types";
import { ILruApiCache } from "../../lru-cache/lru-api-cache";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestFile, PullRequestId, RepoId } from "../../types/kea";
import { IKeaRepository, IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../kea-repository";

export class GitHubRepository implements IKeaRepository {
  account: GitHubAccount;
  remoteUrl: string;
  repoId: RepoId;
  #cache: ILruApiCache;

  constructor(remoteUrl: string, repoId: RepoId, account: GitHubAccount, cache: ILruApiCache) {
    this.remoteUrl = remoteUrl;
    this.repoId = repoId;
    this.account = account;
    this.#cache = cache;
  }

  #generateKey = <R extends Route>(
    route: keyof Endpoints | R,
    options?: R extends keyof Endpoints ? Endpoints[R]["parameters"] : never,
  ): CacheKey | Error => {
    const [method, path] = route.split(" ");

    if (typeof method !== "string" || typeof path !== "string") {
      return new Error(`Invalid route: ${route}`);
    }

    if (!isMethod(method)) {
      return new Error(`Invalid method: ${method}`);
    }

    if (options === undefined) {
      return new Error(`Invalid options: ${options}`);
    }

    if (!("owner" in options) || !("repo" in options)) {
      return new Error("Missing owner or repo in options");
    }

    const owner = options.owner;
    const repo = options.repo;

    const pathParts = path.split("/");
    const templatedEndpoint = pathParts
      .map((part) => {
        const isTemplate = part.startsWith("{") && part.endsWith("}");
        if (!isTemplate) {
          return part;
        }

        const paramName = part.slice(1, -1) as keyof typeof options & string;
        const paramValue = options[paramName];
        if (paramValue === undefined) {
          Logger.warn(`Missing parameter ${paramName} in options`);
          return part;
        }

        return String(paramValue);
      })
      .join("/");

    const cacheKey: CacheKey = [owner, repo, templatedEndpoint, method];
    return cacheKey;
  };

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
  ): Promise<{ wasCached: boolean; data: R extends keyof Endpoints ? Endpoints[R]["response"]["data"] : never }> => {
    type RequestResult = R extends keyof Endpoints ? Endpoints[R]["response"] : never;

    const cacheKey = this.#generateKey(route, options);
    if (cacheKey instanceof Error) {
      // We throw the error so that the caller can handle it.
      // eslint-disable-next-line no-restricted-syntax
      throw cacheKey;
    }

    const cachedResult = this.#cache.get(...cacheKey);

    if (forceRequest !== true) {
      if (cachedResult !== undefined) {
        return {
          data: cachedResult.data as RequestResult,
          wasCached: true,
        };
      }
    }

    const octokit = await this.account.getOctokit();
    if (octokit instanceof Error) {
      // We throw the error so that the caller can handle it.
      // eslint-disable-next-line no-restricted-syntax
      throw octokit;
    }

    // const previousHeaders = this.#cache.getHeaders(cacheKey);
    const previousHeaders = cachedResult?.headers;
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
    this.#cache.set(...cacheKey, fetchedResult.data, resultHeaders);
    return {
      data: fetchedResult.data as RequestResult,
      wasCached: false,
    };
  };

  getPullRequestList = async (forceRequest?: boolean): Promise<PullRequest[] | Error> => {
    try {
      const { data } = await this.#request(
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

      return data.map(convertGitHubPullRequestListItem);
    } catch (error) {
      return new Error(`Error fetching pull requests: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  getPullRequest = async (pullId: PullRequestId, forceRequest?: boolean): Promise<PullRequest | Error> => {
    try {
      const { data } = await this.#request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner: pullId.owner,
          repo: pullId.repo,
          pull_number: pullId.number,
        },
        forceRequest,
      );

      return convertGitHubPullRequest(data);
    } catch (error) {
      return new Error(`Error fetching pull request: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  getIssueComments = async (issueId: IssueId, forceRequest?: boolean): Promise<IssueComment[] | Error> => {
    let result: IssueComment[] | Error;
    let wasCached = false;
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

      result = response.data.map(convertGitHubIssueComment);
      wasCached = response.wasCached;
    } catch (error) {
      result = new Error(`Error fetching issue comments: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!wasCached) {
      this.#onDidChangeIssueComments.fire({ issueId, comments: result });
    }
    return result;
  };

  getPullRequestReviewComments = async (pullId: PullRequestId, forceRequest?: boolean): Promise<PullRequestComment[] | Error> => {
    let result: PullRequestComment[] | Error;
    let wasCached = false;
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

      result = response.data.map(convertGitHubPullRequestReviewComment);
      wasCached = response.wasCached;
    } catch (error) {
      result = new Error(`Error fetching pull request comments: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!wasCached) {
      this.#onDidChangePullRequestReviewComments.fire({ pullId, comments: result });
    }
    return result;
  };

  getPullRequestFiles = async (pullId: PullRequestId, forceRequest?: boolean): Promise<PullRequestFile[] | Error> => {
    try {
      const { data: response } = await this.#request(
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
