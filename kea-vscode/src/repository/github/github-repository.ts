import { Endpoints, RequestParameters, Route } from "@octokit/types";
import * as vscode from "vscode";
import { GitHubAccount } from "../../account/github/github-account";
import {
  convertGitHubCommit,
  convertGitHubCommitComment,
  convertGitHubFile,
  convertGitHubIssueComment,
  convertGitHubPullRequest,
  convertGitHubPullRequestListItem,
  convertGitHubPullRequestReviewComment,
} from "../../account/github/github-utils";
import { IApiCache } from "../../cache/api/api-cache";
import { CacheKey, isMethod } from "../../cache/api/api-cache-types";
import { KeaDisposable } from "../../core/kea-disposable";
import { Logger } from "../../core/logger";
import { WrappedError } from "../../core/wrapped-error";
import {
  Commit,
  CommitComment,
  CommitFile,
  IssueComment,
  IssueId,
  PullRequest,
  PullRequestComment,
  PullRequestId,
  RepoId,
} from "../../types/kea";
import { IKeaRepository, IssueCommentsPayload, PullRequestReviewCommentsPayload } from "../kea-repository";

export class GitHubRepository extends KeaDisposable implements IKeaRepository {
  account: GitHubAccount;
  remoteUrl: string;
  repoId: RepoId;
  #cache: IApiCache;

  #onDidChangeIssueComments: vscode.EventEmitter<IssueCommentsPayload> = this._registerDisposable(
    new vscode.EventEmitter<IssueCommentsPayload>(),
  );
  onDidChangeIssueComments = this.#onDidChangeIssueComments.event;

  #onDidChangePullRequestReviewComments: vscode.EventEmitter<PullRequestReviewCommentsPayload> = this._registerDisposable(
    new vscode.EventEmitter<PullRequestReviewCommentsPayload>(),
  );
  onDidChangePullRequestReviewComments = this.#onDidChangePullRequestReviewComments.event;

  constructor(remoteUrl: string, repoId: RepoId, account: GitHubAccount, cache: IApiCache) {
    super();
    this.remoteUrl = remoteUrl;
    this.repoId = repoId;
    this.account = account;
    this.#cache = cache;
  }

  override _dispose = () => {
    this.#cache.invalidate(this.repoId.owner, this.repoId.repo);
  };

  #generateKey = <R extends Route>(
    route: keyof Endpoints | R,
    options?: R extends keyof Endpoints ? Endpoints[R]["parameters"] : never,
  ): CacheKey | Error => {
    const [method, path] = route.split(" ");

    if (typeof method !== "string" || typeof path !== "string") {
      return new WrappedError(`Invalid route: ${route}`);
    }

    if (!isMethod(method)) {
      return new WrappedError(`Invalid method: ${method}`);
    }

    if (options === undefined) {
      return new WrappedError(`Invalid options: ${options}`);
    }

    if (!("owner" in options) || !("repo" in options)) {
      return new WrappedError("Missing owner or repo in options");
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
      return new WrappedError(`Error fetching pull requests`, error);
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
      return new WrappedError(`Error fetching pull request`, error);
    }
  };

  getIssueComments = async (issueId: IssueId, forceRequest?: boolean): Promise<IssueComment[] | Error> => {
    try {
      const { data, wasCached } = await this.#request(
        "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
        {
          owner: issueId.owner,
          repo: issueId.repo,
          issue_number: issueId.number,
        },
        forceRequest,
      );

      const result = data.map(convertGitHubIssueComment);
      if (!wasCached) {
        this.#onDidChangeIssueComments.fire({ issueId, comments: result });
      }

      return result;
    } catch (error) {
      return new WrappedError(`Error fetching issue comments`, error);
    }
  };

  getPullRequestReviewComments = async (pullId: PullRequestId, forceRequest?: boolean): Promise<PullRequestComment[] | Error> => {
    try {
      const { data, wasCached } = await this.#request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
        {
          owner: pullId.owner,
          repo: pullId.repo,
          pull_number: pullId.number,
        },
        forceRequest,
      );

      const result = data.map(convertGitHubPullRequestReviewComment);
      if (!wasCached) {
        this.#onDidChangePullRequestReviewComments.fire({ pullId, comments: result });
      }

      return result;
    } catch (error) {
      return new WrappedError(`Error fetching pull request comments`, error);
    }
  };

  getPullRequestFiles = async (pullId: PullRequestId, forceRequest?: boolean): Promise<CommitFile[] | Error> => {
    try {
      const { data } = await this.#request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
        {
          owner: pullId.owner,
          repo: pullId.repo,
          pull_number: pullId.number,
        },
        forceRequest,
      );

      return data.map(convertGitHubFile);
    } catch (error) {
      return new WrappedError(`Error fetching pull request files`, error);
    }
  };

  getPullRequestCommits = async (pullId: PullRequestId, forceRequest?: boolean): Promise<Commit[] | Error> => {
    try {
      const { data } = await this.#request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
        {
          owner: pullId.owner,
          repo: pullId.repo,
          pull_number: pullId.number,
        },
        forceRequest,
      );

      return data.map(convertGitHubCommit);
    } catch (error) {
      return new WrappedError(`Error fetching pull request commits`, error);
    }
  };

  getCommitFiles = async (commitSha: string, forceRequest?: boolean): Promise<CommitFile[] | Error> => {
    try {
      const { data } = await this.#request(
        "GET /repos/{owner}/{repo}/commits/{ref}",
        {
          owner: this.repoId.owner,
          repo: this.repoId.repo,
          ref: commitSha,
        },
        forceRequest,
      );

      return data.files?.map(convertGitHubFile) ?? [];
    } catch (error) {
      return new WrappedError(`Error fetching commit files`, error);
    }
  };

  getCommitComments = async (commitSha: string, forceRequest?: boolean): Promise<CommitComment[] | Error> => {
    try {
      const { data } = await this.#request(
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments",
        {
          owner: this.repoId.owner,
          repo: this.repoId.repo,
          commit_sha: commitSha,
        },
        forceRequest,
      );

      return data.map(convertGitHubCommitComment);
    } catch (error) {
      return new WrappedError(`Error fetching commit comments`, error);
    }
  };
}
