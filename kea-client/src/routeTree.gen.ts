/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { createFileRoute } from "@tanstack/react-router";

// Import Routes

import { Route as ProviderOwnerRepoPullPrIdPullImport } from "./routes/$provider/$owner/$repo/pull/$prId/_pull";
import { Route as ProviderOwnerRepoPullPrIdPullIndexImport } from "./routes/$provider/$owner/$repo/pull/$prId/_pull.index";
import { Route as ProviderOwnerRepoPullPrIdPullReviewImport } from "./routes/$provider/$owner/$repo/pull/$prId/_pull.review";
import { Route as ProviderIndexImport } from "./routes/$provider/index";
import { Route as rootRoute } from "./routes/__root";
import { Route as IndexImport } from "./routes/index";

// Create Virtual Routes

const ProviderOwnerRepoPullPrIdImport = createFileRoute("/$provider/$owner/$repo/pull/$prId")();

// Create/Update Routes

const IndexRoute = IndexImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRoute,
} as any);

const ProviderIndexRoute = ProviderIndexImport.update({
  id: "/$provider/",
  path: "/$provider/",
  getParentRoute: () => rootRoute,
} as any);

const ProviderOwnerRepoPullPrIdRoute = ProviderOwnerRepoPullPrIdImport.update({
  id: "/$provider/$owner/$repo/pull/$prId",
  path: "/$provider/$owner/$repo/pull/$prId",
  getParentRoute: () => rootRoute,
} as any);

const ProviderOwnerRepoPullPrIdPullRoute = ProviderOwnerRepoPullPrIdPullImport.update({
  id: "/_pull",
  getParentRoute: () => ProviderOwnerRepoPullPrIdRoute,
} as any);

const ProviderOwnerRepoPullPrIdPullIndexRoute = ProviderOwnerRepoPullPrIdPullIndexImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => ProviderOwnerRepoPullPrIdPullRoute,
} as any);

const ProviderOwnerRepoPullPrIdPullReviewRoute = ProviderOwnerRepoPullPrIdPullReviewImport.update({
  id: "/review",
  path: "/review",
  getParentRoute: () => ProviderOwnerRepoPullPrIdPullRoute,
} as any);

// Populate the FileRoutesByPath interface

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": {
      id: "/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof IndexImport;
      parentRoute: typeof rootRoute;
    };
    "/$provider/": {
      id: "/$provider/";
      path: "/$provider";
      fullPath: "/$provider";
      preLoaderRoute: typeof ProviderIndexImport;
      parentRoute: typeof rootRoute;
    };
    "/$provider/$owner/$repo/pull/$prId": {
      id: "/$provider/$owner/$repo/pull/$prId";
      path: "/$provider/$owner/$repo/pull/$prId";
      fullPath: "/$provider/$owner/$repo/pull/$prId";
      preLoaderRoute: typeof ProviderOwnerRepoPullPrIdImport;
      parentRoute: typeof rootRoute;
    };
    "/$provider/$owner/$repo/pull/$prId/_pull": {
      id: "/$provider/$owner/$repo/pull/$prId/_pull";
      path: "/$provider/$owner/$repo/pull/$prId";
      fullPath: "/$provider/$owner/$repo/pull/$prId";
      preLoaderRoute: typeof ProviderOwnerRepoPullPrIdPullImport;
      parentRoute: typeof ProviderOwnerRepoPullPrIdRoute;
    };
    "/$provider/$owner/$repo/pull/$prId/_pull/review": {
      id: "/$provider/$owner/$repo/pull/$prId/_pull/review";
      path: "/review";
      fullPath: "/$provider/$owner/$repo/pull/$prId/review";
      preLoaderRoute: typeof ProviderOwnerRepoPullPrIdPullReviewImport;
      parentRoute: typeof ProviderOwnerRepoPullPrIdPullImport;
    };
    "/$provider/$owner/$repo/pull/$prId/_pull/": {
      id: "/$provider/$owner/$repo/pull/$prId/_pull/";
      path: "/";
      fullPath: "/$provider/$owner/$repo/pull/$prId/";
      preLoaderRoute: typeof ProviderOwnerRepoPullPrIdPullIndexImport;
      parentRoute: typeof ProviderOwnerRepoPullPrIdPullImport;
    };
  }
}

// Create and export the route tree

interface ProviderOwnerRepoPullPrIdPullRouteChildren {
  ProviderOwnerRepoPullPrIdPullReviewRoute: typeof ProviderOwnerRepoPullPrIdPullReviewRoute;
  ProviderOwnerRepoPullPrIdPullIndexRoute: typeof ProviderOwnerRepoPullPrIdPullIndexRoute;
}

const ProviderOwnerRepoPullPrIdPullRouteChildren: ProviderOwnerRepoPullPrIdPullRouteChildren = {
  ProviderOwnerRepoPullPrIdPullReviewRoute: ProviderOwnerRepoPullPrIdPullReviewRoute,
  ProviderOwnerRepoPullPrIdPullIndexRoute: ProviderOwnerRepoPullPrIdPullIndexRoute,
};

const ProviderOwnerRepoPullPrIdPullRouteWithChildren =
  ProviderOwnerRepoPullPrIdPullRoute._addFileChildren(ProviderOwnerRepoPullPrIdPullRouteChildren);

interface ProviderOwnerRepoPullPrIdRouteChildren {
  ProviderOwnerRepoPullPrIdPullRoute: typeof ProviderOwnerRepoPullPrIdPullRouteWithChildren;
}

const ProviderOwnerRepoPullPrIdRouteChildren: ProviderOwnerRepoPullPrIdRouteChildren = {
  ProviderOwnerRepoPullPrIdPullRoute: ProviderOwnerRepoPullPrIdPullRouteWithChildren,
};

const ProviderOwnerRepoPullPrIdRouteWithChildren = ProviderOwnerRepoPullPrIdRoute._addFileChildren(
  ProviderOwnerRepoPullPrIdRouteChildren,
);

export interface FileRoutesByFullPath {
  "/": typeof IndexRoute;
  "/$provider": typeof ProviderIndexRoute;
  "/$provider/$owner/$repo/pull/$prId": typeof ProviderOwnerRepoPullPrIdPullRouteWithChildren;
  "/$provider/$owner/$repo/pull/$prId/review": typeof ProviderOwnerRepoPullPrIdPullReviewRoute;
  "/$provider/$owner/$repo/pull/$prId/": typeof ProviderOwnerRepoPullPrIdPullIndexRoute;
}

export interface FileRoutesByTo {
  "/": typeof IndexRoute;
  "/$provider": typeof ProviderIndexRoute;
  "/$provider/$owner/$repo/pull/$prId": typeof ProviderOwnerRepoPullPrIdPullIndexRoute;
  "/$provider/$owner/$repo/pull/$prId/review": typeof ProviderOwnerRepoPullPrIdPullReviewRoute;
}

export interface FileRoutesById {
  __root__: typeof rootRoute;
  "/": typeof IndexRoute;
  "/$provider/": typeof ProviderIndexRoute;
  "/$provider/$owner/$repo/pull/$prId": typeof ProviderOwnerRepoPullPrIdRouteWithChildren;
  "/$provider/$owner/$repo/pull/$prId/_pull": typeof ProviderOwnerRepoPullPrIdPullRouteWithChildren;
  "/$provider/$owner/$repo/pull/$prId/_pull/review": typeof ProviderOwnerRepoPullPrIdPullReviewRoute;
  "/$provider/$owner/$repo/pull/$prId/_pull/": typeof ProviderOwnerRepoPullPrIdPullIndexRoute;
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths:
    | "/"
    | "/$provider"
    | "/$provider/$owner/$repo/pull/$prId"
    | "/$provider/$owner/$repo/pull/$prId/review"
    | "/$provider/$owner/$repo/pull/$prId/";
  fileRoutesByTo: FileRoutesByTo;
  to:
    | "/"
    | "/$provider"
    | "/$provider/$owner/$repo/pull/$prId"
    | "/$provider/$owner/$repo/pull/$prId/review";
  id:
    | "__root__"
    | "/"
    | "/$provider/"
    | "/$provider/$owner/$repo/pull/$prId"
    | "/$provider/$owner/$repo/pull/$prId/_pull"
    | "/$provider/$owner/$repo/pull/$prId/_pull/review"
    | "/$provider/$owner/$repo/pull/$prId/_pull/";
  fileRoutesById: FileRoutesById;
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute;
  ProviderIndexRoute: typeof ProviderIndexRoute;
  ProviderOwnerRepoPullPrIdRoute: typeof ProviderOwnerRepoPullPrIdRouteWithChildren;
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ProviderIndexRoute: ProviderIndexRoute,
  ProviderOwnerRepoPullPrIdRoute: ProviderOwnerRepoPullPrIdRouteWithChildren,
};

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/$provider/",
        "/$provider/$owner/$repo/pull/$prId"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/$provider/": {
      "filePath": "$provider/index.tsx"
    },
    "/$provider/$owner/$repo/pull/$prId": {
      "filePath": "$provider/$owner/$repo/pull/$prId",
      "children": [
        "/$provider/$owner/$repo/pull/$prId/_pull"
      ]
    },
    "/$provider/$owner/$repo/pull/$prId/_pull": {
      "filePath": "$provider/$owner/$repo/pull/$prId/_pull.tsx",
      "parent": "/$provider/$owner/$repo/pull/$prId",
      "children": [
        "/$provider/$owner/$repo/pull/$prId/_pull/review",
        "/$provider/$owner/$repo/pull/$prId/_pull/"
      ]
    },
    "/$provider/$owner/$repo/pull/$prId/_pull/review": {
      "filePath": "$provider/$owner/$repo/pull/$prId/_pull.review.tsx",
      "parent": "/$provider/$owner/$repo/pull/$prId/_pull"
    },
    "/$provider/$owner/$repo/pull/$prId/_pull/": {
      "filePath": "$provider/$owner/$repo/pull/$prId/_pull.index.tsx",
      "parent": "/$provider/$owner/$repo/pull/$prId/_pull"
    }
  }
}
ROUTE_MANIFEST_END */
