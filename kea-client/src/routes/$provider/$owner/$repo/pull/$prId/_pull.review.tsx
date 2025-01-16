import { createFileRoute, SearchSchemaInput } from "@tanstack/react-router";
import { PullRequestDiffTree } from "~/components/pull-request/pull-request-diff-tree";
import { PullRequestDiffViewer } from "~/components/pull-request/pull-request-diff-viewer";
import { parseCompare } from "~/utils/routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull/review")({
  component: RouteComponent,
  validateSearch: (search: { compare?: string } & SearchSchemaInput) => {
    parseCompare(search.compare);
    return search;
  },
});

function RouteComponent() {
  const params = Route.useParams();
  const { owner, repo, prId } = params;

  const queryParams = {
    owner,
    repo,
    pr_number: prId,
  };

  return (
    <div className="flex h-full">
      <PullRequestDiffTree params={queryParams} />
      <PullRequestDiffViewer params={queryParams} />
    </div>
  );
}
