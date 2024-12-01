import { Params, RouteDefinition } from "@solidjs/router";
import App from "./App";

export interface PullRequestPathParams extends Params {
  owner: string;
  repo: string;
  pull: string;
}

export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: () => <div>Home</div>,
  },
  {
    path: "/:owner/:repo/pull/:pull",
    component: () => <App />,
    matchFilters: {
      owner: /^[a-z0-9-]+$/,
      repo: /^[a-z0-9-]+$/,
      pull: /^\d+$/,
    },
  },
];
