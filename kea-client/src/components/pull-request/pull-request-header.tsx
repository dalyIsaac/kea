import { Link, useMatchRoute } from "@tanstack/react-router";
import { GitPullRequest } from "lucide-react";
import { FC } from "react";
import { ToggleGroup, ToggleGroupItem } from "~/shadcn/ui/toggle-group";
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

export const PullRequestHeader: FC<PullRequestHeaderProps> = ({ title, ...params }) => {
  const matchRoute = useMatchRoute();

  return (
    <div className="flex items-center justify-between mb-6">
      <PullRequestTitle title={title} id={params.prId} />

      <ToggleGroup
        type="single"
        value={
          matchRoute({
            to: "/$provider/$owner/$repo/pull/$prId/review",
            params,
          })
            ? "/review"
            : "/"
        }
      >
        <ToggleGroupItem value="/" asChild>
          <Link to="/$provider/$owner/$repo/pull/$prId" params={params}>
            Overview
          </Link>
        </ToggleGroupItem>

        <ToggleGroupItem value="/review" asChild>
          <Link to="/$provider/$owner/$repo/pull/$prId/review" params={params}>
            Review
          </Link>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
