import { createFileRoute, SearchSchemaInput } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { $api } from "~/api/api";
import { DiffTree } from "~/components/diff-tree/diff-tree";
import { PullRequestDiffViewer } from "~/components/pull-request/pull-request-diff-viewer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/shadcn/ui/resizable";
import { fileTreeSlice } from "~/state/file-tree/slice";
import { parseCompare } from "~/utils/routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull/review")({
  component: RouteComponent,
  validateSearch: (search: { compare?: string; path?: string } & SearchSchemaInput) => {
    parseCompare(search.compare);
    return search;
  },
});

function RouteComponent() {
  const dispatch = useDispatch();

  const { path } = Route.useSearch();
  const params = Route.useParams();
  const { owner, repo, prId } = params;
  const navigate = Route.useNavigate();

  const queryParams = {
    owner,
    repo,
    pr_number: prId,
  };

  const filesQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}/files", {
    params: {
      path: queryParams,
    },
  });

  // Redirect to the first file in the list.
  useEffect(() => {
    if (!filesQuery.data) {
      return;
    }

    const firstFile = filesQuery.data[0];
    if (!firstFile) {
      return;
    }

    navigate({
      search: {
        path: firstFile.filename,
      },
    });
  }, [filesQuery.data, navigate]);

  // Update the selected file when the path changes.
  useEffect(() => {
    if (!path) {
      return;
    }

    dispatch(fileTreeSlice.actions.setSelectedPath(path));
  }, [dispatch, path]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <DiffTree data={filesQuery.data} />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel>
        <PullRequestDiffViewer params={queryParams} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
