import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { $api } from "~/api/api";
import { DiffEntry } from "~/api/types";
import { DiffTree } from "~/components/diff-tree/diff-tree";
import { ReviewEditor } from "~/monaco/review-editor/review-editor";
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

const useNavigateToFirstFile = (
  selectedFilePath: string | undefined,
  files: DiffEntry[] | undefined,
  navigate: ReturnType<typeof Route.useNavigate>,
) => {
  useEffect(() => {
    const firstFile = files?.[0];
    if (!firstFile || selectedFilePath !== undefined) {
      return;
    }

    navigate({
      search: { file: firstFile.sha },
    });
  }, [files, navigate, selectedFilePath]);
};

const useUpdateSelectedPath = (selectedFilePath: string | undefined) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedFilePath === undefined) {
      return;
    }

    const selectedFile = parseFile(selectedFilePath);
    if (!selectedFile) {
      return;
    }

    dispatch(fileTreeSlice.actions.setSelectedPath(selectedFile));
  }, [dispatch, selectedFilePath]);
};

function RouteComponent() {
  const navigate = Route.useNavigate();

  const { file: selectedFilePath } = Route.useSearch();
  const params = Route.useParams();
  const { owner, repo, prId } = params;

  const queryParams = { params: { path: { owner, repo, pr_number: prId } } };

  const filesQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}/files", queryParams);

  const prQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}", queryParams);

  const commentsQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}/comments", queryParams);

  useNavigateToFirstFile(selectedFilePath, filesQuery.data, navigate);
  useUpdateSelectedPath(selectedFilePath);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={20}>
        <DiffTree data={filesQuery.data} />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel>
        <ReviewEditor
          owner={params.owner}
          repo={params.repo}
          originalRef={prQuery.data?.base.sha}
          modifiedRef={prQuery.data?.head.sha}
          comments={commentsQuery.data}
          diffEntries={filesQuery.data}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
