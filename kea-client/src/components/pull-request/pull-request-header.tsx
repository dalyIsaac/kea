import { GitPullRequest } from "lucide-react";
import { FC } from "react";
import { SegmentedLink, SegmentedLinkContainer } from "~/components/segmented-link-control";
import { PullRequestDetailsParams } from "~/utils/validate-routes";

const PullRequestTitle: FC<{
  title: string | undefined | null;
  id: number;
}> = ({ title, id }) => (
  <div className="flex items-center gap-2">
    <GitPullRequest className="w-5 h-5" />
    <span className="text-2xl font-bold">{title}</span>
    <span className="text-2xl font-light">#{id}</span>
  </div>
);

interface PullRequestHeaderProps extends PullRequestDetailsParams {
  title: string | undefined | null;
}

export const PullRequestHeader: FC<PullRequestHeaderProps> = ({ title, ...params }) => (
  <div className="flex items-center justify-between mb-6">
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
  </div>
);
