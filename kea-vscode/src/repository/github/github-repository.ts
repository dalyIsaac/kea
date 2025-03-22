import { Octokit } from "@octokit/rest";
import {
  convertGitHubIssueComment,
  convertGitHubPullRequest,
  convertGitHubPullRequestFile,
  convertGitHubPullRequestReviewComment,
} from "../../account/github/github-utils";
import { IssueComment, IssueId, PullRequest, PullRequestComment, PullRequestFile, PullRequestId, RepoId } from "../../types/kea";
import { IKeaRepository } from "../kea-repository";

export class GitHubRepository implements IKeaRepository {
  authSessionAccountId: string;
  remoteUrl: string;
  repoId: RepoId;
  #octokit: Octokit;

  constructor(authSessionAccountId: string, remoteUrl: string, repoId: RepoId, octokit: Octokit) {
    this.authSessionAccountId = authSessionAccountId;
    this.remoteUrl = remoteUrl;
    this.repoId = repoId;
    this.#octokit = octokit;
  }

  getPullRequestList = async (): Promise<PullRequest[] | Error> => {
    try {
      const response = await this.#octokit.pulls.list({
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
    try {
      const response = await this.#octokit.issues.listComments({
        owner: issueId.owner,
        repo: issueId.repo,
        issue_number: issueId.number,
      });

      return response.data.map(convertGitHubIssueComment);
    } catch (error) {
      return new Error(`Error fetching issue comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  getPullRequestReviewComments = async (pullId: PullRequestId): Promise<PullRequestComment[] | Error> => {
    try {
      const response = await this.#octokit.pulls.listReviewComments({
        owner: pullId.owner,
        repo: pullId.repo,
        pull_number: pullId.number,
      });

      return response.data.map(convertGitHubPullRequestReviewComment);
    } catch (error) {
      return new Error(`Error fetching pull request comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  getPullRequestFiles = async (pullId: PullRequestId): Promise<PullRequestFile[] | Error> => {
    try {
      const response = await this.#octokit.pulls.listFiles({
        owner: pullId.owner,
        repo: pullId.repo,
        pull_number: pullId.number,
      });

      return response.data.map(convertGitHubPullRequestFile);
    } catch (error) {
      return new Error(`Error fetching pull request files: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}
