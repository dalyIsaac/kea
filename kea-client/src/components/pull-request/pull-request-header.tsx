import { Link, useMatchRoute } from "@tanstack/react-router";
import { GitPullRequest } from "lucide-react";
import { FC, PropsWithChildren } from "react";
import { ToggleGroup, ToggleGroupItem } from "~/shadcn/ui/toggle-group";
import { PullRequestDetailsParams } from "~/utils/routes";

const PullRequestToggleItem: FC<PropsWithChildren<{ value: string }>> = ({ value, children }) => (
  <ToggleGroupItem
    value={value}
    className="h-fit border border-transparent rounded-sm [&[data-status=active]]:bg-background [&[data-status=active]]:shadow-sm [&[data-status=active]]:font-medium [&[data-status=active]]:border-border [&:not([data-status=active])]:text-muted-foreground"
    asChild
  >
    {children}
  </ToggleGroupItem>
);

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

const PullRequestBranches: FC<{
  head: string;
  base: string;
}> = ({ head, base }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span>{head}</span>
    <span>→</span>
    <span>{base}</span>
  </div>
);

const PullRequestNav: FC<PullRequestDetailsParams> = (params) => {
  const matchRoute = useMatchRoute();
  const baseRoute = `/${params.provider}/${params.owner}/${params.repo}/pull/${params.prId}`;
  const reviewRoute = `${baseRoute}/review`;

  const isReviewRoute = matchRoute({
    to: "/$provider/$owner/$repo/pull/$prId/review",
    params,
  });

  return (
    <ToggleGroup
      type="single"
      className="border rounded-md bg-secondary/30 text-xs h-fit m-1"
      value={isReviewRoute ? reviewRoute : baseRoute}
    >
      <PullRequestToggleItem value={baseRoute}>
        <Link
          to="/$provider/$owner/$repo/pull/$prId"
          params={params}
          activeOptions={{ exact: true }}
          className="px-2 py-0.5 block"
        >
          Overview
        </Link>
      </PullRequestToggleItem>

      <PullRequestToggleItem value={reviewRoute}>
        <Link
          to="/$provider/$owner/$repo/pull/$prId/review"
          params={params}
          activeOptions={{ exact: true, includeSearch: false }}
          className="px-2 py-0.5 block"
        >
          Review
        </Link>
      </PullRequestToggleItem>
    </ToggleGroup>
  );
};

interface PullRequestHeaderProps extends PullRequestDetailsParams {
  title: string | undefined | null;
  base?: string;
  head?: string;
}

export const PullRequestHeader: FC<PullRequestHeaderProps> = ({ title, base, head, ...params }) => {
  return (
    <div className="flex gap-2 justify-between">
      <div className="flex flex-col gap">
        <PullRequestTitle title={title} id={params.prId} />
        {base && head && <PullRequestBranches base={base} head={head} />}
      </div>

      <PullRequestNav {...params} />
    </div>
  );
};
