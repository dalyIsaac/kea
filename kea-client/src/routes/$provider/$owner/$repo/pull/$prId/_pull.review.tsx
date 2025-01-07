import { Box, themeGet } from "@primer/react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { $api } from "~/api/api";
import { Monaco } from "~/components/monaco/monaco";
import { PullRequestCommits } from "~/components/pull-request/pull-request-commits";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull/review")({
  component: RouteComponent,
});

const StyledPullRequestCommits = styled(PullRequestCommits)`
  width: ${themeGet("sizes.small")};
`;

const StyledMonaco = styled(Monaco)`
  height: 100%;
`;

function RouteComponent() {
  const { owner, repo, prId } = Route.useParams();

  const commitsQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}/commits", {
    params: {
      path: {
        owner,
        repo,
        pr_number: prId,
      },
    },
  });

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <StyledPullRequestCommits commits={commitsQuery.data} />
      <StyledMonaco />
    </Box>
  );
}
