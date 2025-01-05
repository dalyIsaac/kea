import { createFileRoute } from "@tanstack/react-router";
import { $api } from "~/api/api";
import { PullRequestDetails } from "~/components/pull-request/pull-request-details";

export const Route = createFileRoute(
  "/$provider/$owner/$repo/pull/$prId/_pull/",
)({
  component: PullRequestComponent,
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

  return <PullRequestDetails details={details.data} />;
}
