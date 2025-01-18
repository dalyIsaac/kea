import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { $api } from "~/api/api";
import { DiffTree } from "~/components/diff-tree/diff-tree";
import { PullRequestDiffViewer } from "~/components/pull-request/pull-request-diff-viewer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/shadcn/ui/resizable";
import { fileTreeSlice } from "~/state/file-tree/slice";
import { parseCompare, parseFile } from "~/utils/routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId/_pull/review")({
  component: RouteComponent,
  validateSearch: (search: { compare?: string; file?: string }) => {
    parseCompare(search.compare);
    parseFile(search.file);
    return search;
  },
});

function RouteComponent() {
  const dispatch = useDispatch();
  const navigate = Route.useNavigate();

  const { file } = Route.useSearch();
  const params = Route.useParams();
  const { owner, repo, prId } = params;

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

  useEffect(() => {
    if (!filesQuery.data || file) {
      return;
    }

    const firstFile = filesQuery.data[0];
    if (!firstFile) {
      return;
    }

    navigate({
      search: { file: firstFile.sha },
    });
  }, [file, filesQuery.data, navigate]);

  useEffect(() => {
    if (!file) {
      return;
    }

    const selectedFile = parseFile(file);
    if (!selectedFile) {
      return;
    }

    dispatch(fileTreeSlice.actions.setSelectedPath(selectedFile));
  }, [dispatch, file]);

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
