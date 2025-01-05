import { Box } from "@primer/react";
import { createFileRoute } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { $api } from "~/api/api";
import * as apiTypes from "~/api/types";
import { appCrumbs } from "~/components/app-crumbs/app-crumbs";
import { PullRequestDetails } from "~/components/pull-request/pull-request-details";
import {
  PullRequestNav,
  PullRequestTitle,
} from "~/components/pull-request/pull-request-header";
import { PullRequestDetailsParams } from "~/components/pull-request/types";
import { validatePrId, validateProvider } from "~/utils/validate-routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/")({
  component: PullRequestComponent,
  params: {
    parse: (params): PullRequestDetailsParams => ({
      provider: validateProvider(params.provider),
      owner: params.owner,
      repo: params.repo,
      prId: validatePrId(params.prId),
    }),
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

function PullRequestComponent() {
  const { owner, repo, prId } = Route.useParams();

  const details = $api.useQuery(
    "get",
    "/github/{owner}/{repo}/pull/{pr_number}",
    {
      params: {
        path: {
          owner,
          repo,
          pr_number: prId,
        },
      },
    },
  );

  useBreadcrumbs(details.data);

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ marginBottom: 3 }}>
        <PullRequestTitle title={details.data?.title} id={prId} />
      </Box>

      <Box
        sx={{
          border: "1px solid",
          borderColor: "border.default",
          borderRadius: 6,
          backgroundColor: "canvas.default",
        }}
      >
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: "border.default",
            backgroundColor: "canvas.subtle",
          }}
        >
          <PullRequestNav />
        </Box>
        <Box sx={{ padding: 3 }}>
          <PullRequestDetails details={details.data} />
        </Box>
      </Box>
    </Box>
  );
}
