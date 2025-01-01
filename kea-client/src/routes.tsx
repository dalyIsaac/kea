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

export interface KeaRouteDefinition extends RouteDefinition {
  info: {
    title:
      | string
      | ((params: Params) => string | Array<{ title: string; url: string }>);
  };
}

export const isKeaRouteDefinition = (
  route: RouteDefinition,
): route is KeaRouteDefinition => {
  return route.info !== undefined && route.info.title !== undefined;
};

export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: lazy(() => import("./routes/home")),
    info: {
      title: "Home",
    },
  },
  {
    path: "/settings",
    component: lazy(() => import("./routes/settings")),
    info: {
      title: "Settings",
    },
  },
  {
    path: "/:owner/:repo/pull/:pull",
    component: lazy(() => import("./routes/pull-request")),
    info: {
      title: ({ owner, repo, pull }: PullRequestRouteParams) =>
        `Pull Request #${pull} - ${owner}/${repo}`,
    },
    matchFilters: {
      pull: /^\d+$/,
    },
  },
  {
    path: "/:owner/:repo/commit/:commit/*file",
    component: lazy(() => import("./routes/commit")),
    info: {
      title: ({ owner, repo, commit }: CommitRouteParams) =>
        `Commit ${commit} - ${owner}/${repo}`,
    },
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
