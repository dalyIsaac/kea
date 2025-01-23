import { $api } from "~/api/api";
import { selectSelectedNode } from "~/state/file-tree/selectors";
import { useKeaSelector } from "~/state/store";
import { RepoParams } from "~/utils/routes";
import { Monaco } from "./monaco/monaco-editor";

export interface DiffViewerProps extends RepoParams {
  originalRef: string | undefined;
  modifiedRef: string | undefined;
  line?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  owner,
  repo,
  modifiedRef,
  originalRef,
}) => {
  const selectedNode = useKeaSelector(selectSelectedNode);
  const originalLine = useKeaSelector((state) => state.fileTree.selectedLeftLine);
  const modifiedLine = useKeaSelector((state) => state.fileTree.selectedRightLine);

  const isAdded = selectedNode?.entry.status === "Added";
  const isDeleted = selectedNode?.entry.status === "Removed";

  const originalFileName = selectedNode?.entry.previous_filename ?? selectedNode?.entry.filename;
  const originalFileQuery = $api.useQuery(
    "get",
    "/github/{owner}/{repo}/file/{git_ref}/{path}",
    {
      params: {
        path: {
          owner,
          repo,
          git_ref: originalRef ?? "",
          path: originalFileName ?? "",
        },
      },
      parseAs: "text",
    },
    {
      enabled: !!selectedNode && !!originalRef && !isAdded,
    },
  );

  const modifiedFileQuery = $api.useQuery(
    "get",
    "/github/{owner}/{repo}/file/{git_ref}/{path}",
    {
      params: {
        path: {
          owner,
          repo,
          git_ref: modifiedRef ?? "",
          path: selectedNode?.entry.filename ?? "",
        },
      },
      parseAs: "text",
    },
    {
      enabled: !!selectedNode && !!modifiedRef && !isDeleted,
    },
  );

  return (
    <Monaco
      mode="diff"
      original={{
        content: isAdded ? "" : (originalFileQuery.data ?? ""),
        language: "plaintext",
        filename: isAdded ? undefined : originalFileName,
        line: originalLine ?? undefined,
      }}
      modified={{
        content: isDeleted ? "" : (modifiedFileQuery.data ?? ""),
        language: "plaintext",
        filename: isDeleted ? undefined : selectedNode?.entry.filename,
        line: modifiedLine ?? undefined,
      }}
    />
  );
};
