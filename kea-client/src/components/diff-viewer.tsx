import { $api } from "~/api/api";
import { selectSelectedNode } from "~/state/file-tree/selectors";
import { useKeaSelector } from "~/state/store";
import { RepoParams } from "~/utils/routes";
import { Monaco } from "./monaco/monaco";

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

  const { originalLine, modifiedLine } = useKeaSelector((state) => ({
    originalLine: state.fileTree.selectedLeftLine,
    modifiedLine: state.fileTree.selectedRightLine,
  }));

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
      enabled: !!selectedNode && !!originalRef,
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
      enabled: !!selectedNode && !!modifiedRef,
    },
  );

  return (
    <Monaco
      mode="diff"
      original={{
        content: originalFileQuery.data ?? "",
        language: "plaintext",
        filename: originalFileName,
        line: originalLine ?? undefined,
      }}
      modified={{
        content: modifiedFileQuery.data ?? "",
        language: "plaintext",
        filename: selectedNode?.entry.filename,
        line: modifiedLine ?? undefined,
      }}
    />
  );
};
