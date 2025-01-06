import { Box } from "@primer/react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { $api } from "~/api/api";
import { Monaco } from "~/components/monaco/monaco";
import { PullRequestCommits } from "~/components/pull-request/pull-request-commits";

export const Route = createFileRoute(
  "/$provider/$owner/$repo/pull/$prId/_pull/review",
)({
  component: RouteComponent,
});

const StyledPullRequestCommits = styled(PullRequestCommits)`
  width: 25%;
`;

const StyledMonaco = styled(Monaco)`
  width: 75%;
  height: 100%;
`;

function RouteComponent() {
  const { owner, repo, prId } = Route.useParams();

  const commitsQuery = $api.useQuery(
    "get",
    "/github/{owner}/{repo}/pull/{pr_number}/commits",
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
    <Box sx={{ display: "flex" }}>
      <StyledPullRequestCommits commits={commitsQuery.data} />
      <StyledMonaco />
    </Box>
  );
}
