import { createQuery, skipToken } from "@tanstack/solid-query";
import { PullRequestPathParams } from "./routes";
import { Octokit } from "octokit";
import { createSignal } from "solid-js";
import { makePersisted } from "@solid-primitives/storage";

export const [personalAccessToken, setPersonalAccessToken] = makePersisted(
  createSignal(""),
  { storage: localStorage }
);

const [octokit, setOctokit] = createSignal<Octokit>(new Octokit());

export const setApi = (personalAccessToken: string) => {
  setPersonalAccessToken(personalAccessToken);
  setOctokit(new Octokit({ auth: personalAccessToken }));
};

export const createPullRequestDetailsQuery = (params: PullRequestPathParams) =>
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

export const createPullRequestFilesQuery = (params: PullRequestPathParams) =>
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

export const createFileBlobQuery = (
  params: PullRequestPathParams,
  sha: string | undefined,
  path: string | undefined
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
