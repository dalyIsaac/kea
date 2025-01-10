import { createFileRoute, SearchSchemaInput } from "@tanstack/react-router";
import { $api } from "~/api/api";
import { PullRequestCommits } from "~/components/pull-request/pull-request-commits";
import { PullRequestDetails } from "~/components/pull-request/pull-request-details";
import { VerticalSeparator } from "~/components/separator";
import { parseCompare } from "~/utils/routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull/")({
  component: PullRequestComponent,
  validateSearch: (search: { compare?: string } & SearchSchemaInput) => {
    parseCompare(search.compare);
    return search;
  },
});

function PullRequestComponent() {
  const params = Route.useParams();
  const { owner, repo, prId } = params;

  const { compare } = Route.useSearch();
  const { base, head } = parseCompare(compare);

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
    <div className="flex h-full">
      <PullRequestCommits
        commits={commitsQuery.data}
        headSha={prQuery.data?.head?.sha}
        baseSha={prQuery.data?.base?.sha}
        selectedHead={head ?? prQuery.data?.head?.sha}
        selectedBase={base ?? prQuery.data?.base?.sha}
        params={params}
      />
      <VerticalSeparator />
      <PullRequestDetails details={prQuery.data} />
    </div>
  );
}
