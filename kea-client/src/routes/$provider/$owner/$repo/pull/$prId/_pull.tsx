import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { $api } from "~/api/api";
import * as apiTypes from "~/api/types";
import { appCrumbs } from "~/components/app-crumbs/app-crumbs";
import { PullRequestHeader } from "~/components/pull-request/pull-request-header";
import { validatePullRequestRoute } from "~/utils/validate-routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull")({
  component: RouteComponent,
  params: {
    parse: validatePullRequestRoute,
  },
});

const useBreadcrumbs = (details: apiTypes.PullRequestDetails | undefined) => {
  const { owner, repo, prId, provider } = Route.useParams();
  const [, setAppCrumbs] = useAtom(appCrumbs);

  // Initial render.
  useEffect(() => {
    setAppCrumbs([
      { text: owner, href: `/${provider}/${owner}` },
      { text: repo, href: `/${provider}/${owner}/${repo}` },
      { text: "pulls", href: `/${provider}/${owner}/${repo}/pulls` },
      {
        text: `#${prId}`,
        href: `/${provider}/${owner}/${repo}/pull/${prId}`,
      },
    ]);
  }, [owner, repo, prId, setAppCrumbs, provider]);

  // Loaded state.
  useEffect(() => {
    if (!details) {
      return;
    }

    setAppCrumbs([
      { text: details.owner, href: `/${provider}/${owner}` },
      { text: details.repo, href: `/${provider}/${owner}/${repo}` },
      { text: "pulls", href: `/${provider}/${owner}/${repo}/pulls` },
      {
        text: `#${prId}`,
        href: `/${provider}/${owner}/${repo}/pull/${prId}`,
      },
    ]);
  }, [owner, repo, prId, setAppCrumbs, provider, details]);
};

function RouteComponent() {
  const params = Route.useParams();
  const { owner, repo, prId } = params;

  const detailsQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}", {
    params: {
      path: {
        owner,
        repo,
        pr_number: prId,
      },
    },
  });

  useBreadcrumbs(detailsQuery.data);

  return (
    <div className="p-4 flex flex-col h-full min-h-0">
      <PullRequestHeader title={detailsQuery.data?.title} {...params} />

      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
