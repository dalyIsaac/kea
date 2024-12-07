import { Params, RouteDefinition } from "@solidjs/router";
import { Commit } from "./routes/commit";
import { PullRequest } from "./routes/pull-request";
import { Page } from "./components/common/page";

export interface PullRequestRouteParams extends Params {
  owner: string;
  repo: string;
  pull: string;
}

export interface CommitRouteParams extends Params {
  owner: string;
  repo: string;
  commit: string;
}

export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: () => <div>Home</div>,
  },
  {
    path: "/:owner/:repo/pull/:pull",
    component: () => (
      <Page>
        <PullRequest />
      </Page>
    ),
    matchFilters: {
      pull: /^\d+$/,
    },
  },
  {
    path: "/:owner/:repo/commit/:commit",
    component: () => (
      <Page>
        <Commit />
      </Page>
    ),
    matchFilters: {
      commit: /^[a-f0-9]+$/,
    },
  },

  // 404
  {
    path: "*",
    component: () => <div>404</div>,
  },
];
