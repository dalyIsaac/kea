import { createFileRoute, SearchSchemaInput, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { $api } from "~/api/api";
import { DiffEntryTree } from "~/components/diff-entry/diff-entry-tree";
import { PullRequestCommits } from "~/components/pull-request/pull-request-commits";
import { parseCompare } from "~/utils/routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull/review")({
  component: RouteComponent,
  validateSearch: (search: { compare?: string } & SearchSchemaInput) => {
    parseCompare(search.compare);
    return search;
  },
});

function RouteComponent() {
  const navigate = useNavigate();
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

  const filesQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}/files", {
    params: {
      path: {
        owner,
        repo,
        pr_number: prId,
      },
    },
  });

  useEffect(() => {
    if (!compare && commitsQuery.data && prQuery.data) {
      navigate({
        to: "/$provider/$owner/$repo/pull/$prId/review",
        params,
        search: {
          compare: `${prQuery.data.base.sha}...${prQuery.data.head.sha}`,
        },
      });
    }
  }, [compare, commitsQuery.data, prQuery.data, navigate, params]);

  return (
    <div className="flex h-full">
      <PullRequestCommits
        className="w-[240px] pr-4"
        commits={commitsQuery.data}
        headSha={prQuery.data?.head?.sha}
        baseSha={prQuery.data?.base?.sha}
        selectedHead={head ?? prQuery.data?.head?.sha}
        selectedBase={base ?? prQuery.data?.base?.sha}
        params={params}
      />

      <DiffEntryTree data={filesQuery.data ?? []} />

      <div className="border-l border-gray-200 mx-4" />

      {/* <Monaco className="h-full w-full" /> */}
    </div>
  );
}
