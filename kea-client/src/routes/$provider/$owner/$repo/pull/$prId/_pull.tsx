import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { $api } from "~/api/api";
import * as apiTypes from "~/api/types";
import { PullRequestHeader } from "~/components/pull-request/pull-request-header";
import { crumbsSlice } from "~/state/crumbs/slice";
import { validatePullRequestRoute } from "~/utils/routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull")({
  component: RouteComponent,
  params: {
    parse: validatePullRequestRoute,
  },
});

const useBreadcrumbs = (details: apiTypes.PullRequestDetails | undefined) => {
  const { owner, repo, prId, provider } = Route.useParams();
  const dispatch = useDispatch();

  // Initial render.
  useEffect(() => {
    dispatch(
      crumbsSlice.actions.setCrumbs([
        { text: owner, href: `/${provider}/${owner}` },
        { text: repo, href: `/${provider}/${owner}/${repo}` },
        { text: "pulls", href: `/${provider}/${owner}/${repo}/pulls` },
        {
          text: `#${prId}`,
          href: `/${provider}/${owner}/${repo}/pull/${prId}`,
        },
      ]),
    );
  }, [owner, repo, prId, provider, dispatch]);

  // Loaded state.
  useEffect(() => {
    if (!details) {
      return;
    }

    dispatch(
      crumbsSlice.actions.setCrumbs([
        { text: details.owner, href: `/${provider}/${owner}` },
        { text: details.repo, href: `/${provider}/${owner}/${repo}` },
        { text: "pulls", href: `/${provider}/${owner}/${repo}/pulls` },
        {
          text: `#${prId}`,
          href: `/${provider}/${owner}/${repo}/pull/${prId}`,
        },
      ]),
    );
  }, [owner, repo, prId, provider, details, dispatch]);
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
    <div className="flex h-full min-h-0 flex-col gap-1 p-4">
      <PullRequestHeader
        title={detailsQuery.data?.title}
        base={detailsQuery.data?.base.label}
        head={detailsQuery.data?.head.label}
        {...params}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
