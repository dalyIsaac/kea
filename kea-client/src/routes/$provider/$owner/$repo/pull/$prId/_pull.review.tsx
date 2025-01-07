import { Box, themeGet } from "@primer/react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { $api } from "~/api/api";
import { Monaco } from "~/components/monaco/monaco";
import { PullRequestCommits } from "~/components/pull-request/pull-request-commits";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull/review")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      base: search.base as string | undefined,
      compare: search.compare as string | undefined,
    };
  },
});

const StyledPullRequestCommits = styled(PullRequestCommits)`
  width: ${themeGet("sizes.small")};
`;

const StyledMonaco = styled(Monaco)`
  height: 100%;
`;

function RouteComponent() {
  const params = Route.useParams();
  const { owner, repo, prId } = params;
  const { base, compare } = Route.useSearch();

  const prQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}", {
    params: {
      path: {
        owner,
        repo,
        pr_number: prId,
      },
    },
  });

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
      <StyledPullRequestCommits
        commits={commitsQuery.data}
        headSha={prQuery.data?.head?.sha}
        baseSha={prQuery.data?.base?.sha}
        selectedBase={base}
        selectedCompare={compare}
        params={params}
      />
      <StyledMonaco />
    </Box>
  );
}
