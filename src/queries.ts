import { createQuery, skipToken } from "@tanstack/solid-query";
import { CommitRouteParams, PullRequestRouteParams } from "./routes";
import { Octokit } from "@octokit/rest";
import { createSignal } from "solid-js";
import { makePersisted } from "@solid-primitives/storage";

export const [personalAccessToken, setPersonalAccessToken] = makePersisted(
  createSignal(""),
  { storage: localStorage },
);

const [octokit, setOctokit] = createSignal<Octokit>(new Octokit());

export const setApi = (personalAccessToken: string) => {
  setPersonalAccessToken(personalAccessToken);
  setOctokit(new Octokit({ auth: personalAccessToken }));
};

export const createPullRequestDetailsQuery = (params: PullRequestRouteParams) =>
  createQuery(() => ({
    enabled: !!octokit(),
    queryKey: ["pullRequestDetails", params.repo, params.pull],
    queryFn: () =>
      octokit().rest.pulls.get({
        owner: params.owner,
        repo: params.repo,
        pull_number: parseInt(params.pull),
      }),
  }));

export const createPullRequestFilesQuery = (params: PullRequestRouteParams) =>
  createQuery(() => ({
    enabled: !!octokit(),
    queryKey: ["pullRequestFiles", params.repo, params.pull],
    queryFn: () =>
      octokit().rest.pulls.listFiles({
        owner: params.owner,
        repo: params.repo,
        pull_number: parseInt(params.pull),
      }),
  }));

export const createCommitQuery = (params: CommitRouteParams, ref: string) =>
  createQuery(() => ({
    enabled: !!octokit(),
    queryKey: ["commitFiles", params.repo, ref],
    queryFn: () =>
      octokit().rest.repos.getCommit({
        owner: params.owner,
        repo: params.repo,
        ref: ref,
      }),
  }));

export const createFileBlobQuery = (
  params: PullRequestRouteParams,
  sha: string | undefined,
  path: string | undefined,
) =>
  createQuery(() => ({
    enabled: !!octokit() && !!sha && !!path,
    queryKey: ["fileBlob", params.repo, sha, path],
    queryFn:
      sha && path
        ? () =>
            octokit().rest.git.getBlob({
              owner: params.owner,
              repo: params.repo,
              file_sha: sha,
            })
        : skipToken,
  }));
