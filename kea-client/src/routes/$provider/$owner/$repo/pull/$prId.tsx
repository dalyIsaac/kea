import { Box } from "@primer/react";
import { createFileRoute } from "@tanstack/react-router";
import { $api } from "~/api/api";
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

  return (
    <Box>
      <PullRequestDetails details={details.data} />
    </Box>
  );
}
