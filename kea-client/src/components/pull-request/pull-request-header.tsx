import { Box, Text } from "@primer/react";
import { FC } from "react";
import { SegmentedLink, SegmentedLinkContainer } from "~/components/segmented-link-control";
import { PullRequestDetailsParams } from "~/utils/validate-routes";

const PullRequestTitle: FC<{
  title: string | undefined | null;
  id: number;
}> = ({ title, id }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Text sx={{ fontSize: 22, fontWeight: "bold" }}>{title}</Text>
    <Text sx={{ fontSize: 22, fontWeight: "light" }}>#{id}</Text>
  </Box>
);

interface PullRequestHeaderProps extends PullRequestDetailsParams {
  title: string | undefined | null;
}

export const PullRequestHeader: FC<PullRequestHeaderProps> = ({ title, ...params }) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
    <PullRequestTitle title={title} id={params.prId} />

    <SegmentedLinkContainer>
      <SegmentedLink
        params={params}
        to="/$provider/$owner/$repo/pull/$prId"
        activeOptions={{ exact: true }}
      >
        Overview
      </SegmentedLink>

      <SegmentedLink
        params={params}
        to="/$provider/$owner/$repo/pull/$prId/review"
        activeOptions={{ exact: true }}
      >
        Review
      </SegmentedLink>
    </SegmentedLinkContainer>
  </Box>
);
