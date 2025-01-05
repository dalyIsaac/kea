import { Box } from "@primer/react";
import { createFileRoute } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { $api } from "~/api/api";
import { appCrumbs } from "~/components/app-crumbs/app-crumbs";
import { PullRequestDetails } from "~/components/pull-request-details";
import { validatePrId, validateProvider } from "~/utils/validate-routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId")({
  component: PullRequestComponent,
  params: {
    parse: (params) => {
      return {
        provider: validateProvider(params.provider),
        owner: params.owner,
        repo: params.repo,
        prId: validatePrId(params.prId),
      };
    },
  },
});

function PullRequestComponent() {
  const { owner, repo, prId, provider } = Route.useParams();
  const [, setAppCrumbs] = useAtom(appCrumbs);

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
    const data = details.data;
    if (!data) {
      return;
    }

    setAppCrumbs([
      { text: data.owner, href: `/${provider}/${owner}` },
      { text: data.repo, href: `/${provider}/${owner}/${repo}` },
      { text: "pulls", href: `/${provider}/${owner}/${repo}/pulls` },
      {
        text: `#${prId}`,
        href: `/${provider}/${owner}/${repo}/pull/${prId}`,
      },
    ]);
  }, [owner, repo, prId, setAppCrumbs, provider, details.data]);

  return (
    <Box>
      <PullRequestDetails details={details.data} />
    </Box>
  );
}
