import { Params, Route as _Route, RouteProps, Router } from "@solidjs/router";
import { JSX, lazy } from "solid-js";

export interface OwnerRoute {
  owner: string;
}

export interface RepoRoute extends OwnerRoute {
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

export type KeaComponentRouteProps = Omit<
  RouteProps<string, Params>,
  "children"
> & {
  path: string;
};

const KeaComponentRoute = (props: KeaComponentRouteProps) => (
  <_Route {...props} />
);

export type KeaBaseRouteProps = Omit<KeaComponentRouteProps, "component"> & {
  children: JSX.Element;
};

const KeaBaseRoute = (props: KeaBaseRouteProps) => <_Route {...props} />;

export const KeaRouter = () => (
  <Router>
    <KeaComponentRoute
      path="/"
      component={() => <div>Home</div>}
      info={{ crumb: "Home" }}
    />
    <KeaComponentRoute
      path="/settings"
      component={lazy(() => import("./routes/settings"))}
      info={{ crumb: "Settings" }}
    />

    <KeaBaseRoute path="/gh">
      <KeaComponentRoute
        path="/"
        component={() => <div>gh</div>}
        info={{ crumb: "GitHub" }}
      />

      <KeaBaseRoute
        path="/:owner"
        info={{
          crumb: (params: OwnerRoute) => params.owner,
        }}
      >
        <KeaComponentRoute
          path="/"
          component={() => <div>owner</div>}
          info={{ crumb: "Owner" }}
        />

        <KeaBaseRoute path="/:repo">
          <KeaComponentRoute
            path="/"
            component={lazy(() => import("./routes/repo"))}
            info={{ crumb: (params: RepoRoute) => params.repo }}
          />
          <KeaComponentRoute path="/pulls" component={() => <div>pulls</div>} />
          <_Route
            path="/pull/:pull"
            component={lazy(() => import("./routes/pull-request"))}
            matchFilters={{
              pull: /^\d+$/,
            }}
          />
          <KeaComponentRoute
            path="/commit/:commit"
            component={() => <div>commit</div>}
          />
        </KeaBaseRoute>
      </KeaBaseRoute>
    </KeaBaseRoute>

    <KeaComponentRoute path="*" component={() => <div>404</div>} />
  </Router>
);
