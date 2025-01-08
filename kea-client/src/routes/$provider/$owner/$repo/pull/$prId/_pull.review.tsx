import { createFileRoute, SearchSchemaInput, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { $api } from "~/api/api";
import { Monaco } from "~/components/monaco/monaco";
import { PullRequestCommits } from "~/components/pull-request/pull-request-commits";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull/review")({
  component: RouteComponent,
  validateSearch: (search: { base?: string; head?: string } & SearchSchemaInput) => {
    return {
      base: search.base,
      head: search.head,
    };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const params = Route.useParams();
  const { owner, repo, prId } = params;
  const { base, head } = Route.useSearch();

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

  useEffect(() => {
    if (!base && !head && commitsQuery.data && prQuery.data) {
      navigate({
        to: "/$provider/$owner/$repo/pull/$prId/review",
        params,
        search: {
          base: prQuery.data.base.sha,
          head: prQuery.data.head.sha,
        },
      });
    }
  }, [base, head, commitsQuery.data, prQuery.data, navigate, params]);

  return (
    <div className="flex h-full">
      <PullRequestCommits
        className="w-[240px]"
        commits={commitsQuery.data}
        headSha={prQuery.data?.head?.sha}
        baseSha={prQuery.data?.base?.sha}
        selectedHead={head ?? prQuery.data?.head?.sha}
        selectedBase={base ?? prQuery.data?.base?.sha}
        params={params}
      />
      <Monaco className="h-full" />
    </div>
  );
}
