import { createQuery } from "@tanstack/solid-query";
import { CommitRouteParams, PullRequestRouteParams, RepoRoute } from "./routes";
import { Octokit } from "@octokit/rest";
import { createSignal } from "solid-js";
import { makePersisted } from "@solid-primitives/storage";
import { Fn } from "./types";
import { getStringContent } from "./lib/utils";

const [personalAccessToken, setPersonalAccessToken] = makePersisted(
  createSignal(""),
  { storage: localStorage },
);

const [octokit, setOctokit] = createSignal<Octokit>(
  new Octokit({ auth: personalAccessToken() }),
);

export { personalAccessToken, octokit };

export const setApi = (personalAccessToken: string) => {
  setPersonalAccessToken(personalAccessToken);
  setOctokit(new Octokit({ auth: personalAccessToken }));
};

export const createPullRequestDetailsQuery = (
  params: Fn<PullRequestRouteParams>,
) =>
  createQuery(() => ({
    queryKey: [
      "pullRequestDetails",
      params().owner,
      params().repo,
      params().pull,
    ],
    queryFn: () =>
      octokit().rest.pulls.get({
        owner: params().owner,
        repo: params().repo,
        pull_number: parseInt(params().pull),
      }),
  }));

export const createPullRequestFilesQuery = (
  params: Fn<PullRequestRouteParams>,
) =>
  createQuery(() => ({
    queryKey: [
      "pullRequestFiles",
      params().owner,
      params().repo,
      params().pull,
    ],
    queryFn: () =>
      octokit().rest.pulls.listFiles({
        owner: params().owner,
        repo: params().repo,
        pull_number: parseInt(params().pull),
      }),
  }));

export const createCommitQuery = (
  params: Fn<CommitRouteParams>,
  ref: Fn<string>,
) =>
  createQuery(() => {
    console.log({ ...params });
    return {
      queryKey: ["commitFiles", params().owner, params().repo, ref()],
      queryFn: () =>
        octokit().rest.repos.getCommit({
          owner: params().owner,
          repo: params().repo,
          ref: ref(),
        }),
    };
  });

export const createFileContentQuery = (
  params: Fn<RepoRoute>,
  sha: Fn<string>,
  path: Fn<string | undefined>,
) =>
  createQuery(() => {
    const p = path();
    const queryKey = ["fileBlob", params().owner, params().repo, sha(), p];
    const props = { queryKey, retry: 0, staleTime: 5 * 60_000 };

    if (p === undefined) {
      return {
        ...props,
        enabled: false,
      };
    }

    return {
      ...props,
      queryFn: () =>
        octokit()
          .rest.repos.getContent({
            owner: params().owner,
            repo: params().repo,
            ref: sha(),
            path: p,
          })
          .then((res) => getStringContent(res.data))
          .catch(() => ""),
    };
  });

export const createCommitCommentsQuery = (params: Fn<CommitRouteParams>) =>
  createQuery(() => ({
    queryKey: [
      "commitComments",
      params().owner,
      params().repo,
      params().commit,
    ],
    queryFn: () =>
      octokit().rest.repos.listCommentsForCommit({
        owner: params().owner,
        repo: params().repo,
        commit_sha: params().commit,
      }),
  }));
