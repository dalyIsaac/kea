import { Params, RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

export interface RepoRoute {
  owner: string;
  repo: string;
}

export interface PullRequestRouteParams extends Params, RepoRoute {
  pull: string;
}

export interface CommitRouteParams extends Params, RepoRoute {
  commit: string;
}

export interface CommiteRouteFileParams extends CommitRouteParams {
  file: string;
}

export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: () => <div>Home</div>,
  },
  {
    path: "/settings",
    component: lazy(() => import("./routes/settings")),
  },
  {
    path: "/:owner/:repo/pull/:pull",
    component: lazy(() => import("./routes/pull-request")),
    matchFilters: {
      pull: /^\d+$/,
    },
  },
  {
    path: "/:owner/:repo/commit/:commit/*file",
    component: lazy(() => import("./routes/commit")),
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
