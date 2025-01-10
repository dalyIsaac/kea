import { createFileRoute, SearchSchemaInput, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { $api } from "~/api/api";
import { DiffEntryTree } from "~/components/diff-entry/diff-entry-tree";
import { Monaco } from "~/components/monaco/monaco";
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
  // const { base, head } = parseCompare(compare);

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
      <DiffEntryTree data={filesQuery.data ?? []} />

      <Monaco />
    </div>
  );
}
