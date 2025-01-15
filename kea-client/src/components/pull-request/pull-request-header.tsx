import { Link, useMatchRoute } from "@tanstack/react-router";
import { GitPullRequest } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "~/shadcn/ui/toggle-group";
import { PullRequestDetailsParams } from "~/utils/routes";

const PullRequestToggleItem: React.FC<{ value: string; children: React.ReactNode }> = ({
  value,
  children,
}) => (
  <ToggleGroupItem
    value={value}
    className="h-fit rounded-sm border border-transparent [&:not([data-status=active])]:text-muted-foreground [&[data-status=active]]:border-border [&[data-status=active]]:bg-background [&[data-status=active]]:font-medium [&[data-status=active]]:shadow-sm"
    asChild
  >
    {children}
  </ToggleGroupItem>
);

const PullRequestTitle: React.FC<{
  title: string | undefined | null;
  id: number;
}> = ({ title, id }) => (
  <div className="flex items-center gap-2">
    <GitPullRequest className="h-5 w-5" />
    <span className="text-2xl font-bold">{title}</span>
    <span className="text-2xl font-light">#{id}</span>
  </div>
);

const PullRequestBranches: React.FC<{
  head: string;
  base: string;
}> = ({ head, base }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span>{head}</span>
    <span>→</span>
    <span>{base}</span>
  </div>
);

const PullRequestNav: React.FC<PullRequestDetailsParams> = (params) => {
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
      className="m-1 h-fit rounded-md border bg-secondary/30 text-xs"
      value={isReviewRoute ? reviewRoute : baseRoute}
    >
      <PullRequestToggleItem value={baseRoute}>
        <Link
          to="/$provider/$owner/$repo/pull/$prId"
          params={params}
          activeOptions={{ exact: true }}
          className="block px-2 py-0.5"
        >
          Overview
        </Link>
      </PullRequestToggleItem>

      <PullRequestToggleItem value={reviewRoute}>
        <Link
          to="/$provider/$owner/$repo/pull/$prId/review"
          params={params}
          activeOptions={{ exact: true, includeSearch: false }}
          className="block px-2 py-0.5"
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

export const PullRequestHeader: React.FC<PullRequestHeaderProps> = ({
  title,
  base,
  head,
  ...params
}) => {
  return (
    <div className="flex justify-between gap-2">
      <div className="gap flex flex-col">
        <PullRequestTitle title={title} id={params.prId} />
        {base && head && <PullRequestBranches base={base} head={head} />}
      </div>

      <PullRequestNav {...params} />
    </div>
  );
};
