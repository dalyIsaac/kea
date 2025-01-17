import { useSelector } from "react-redux";
import { $api } from "~/api/api";
import { selectSelectedNode } from "~/state/file-tree/selectors";
import { RepoParams } from "~/utils/routes";
import { Monaco } from "./monaco/monaco";

export interface DiffViewerProps extends RepoParams {
  originalRef: string | undefined;
  modifiedRef: string | undefined;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  owner,
  repo,
  modifiedRef,
  originalRef,
}) => {
  const selectedFile = useSelector(selectSelectedNode);

  const originalFileName = selectedFile?.entry.previous_filename ?? selectedFile?.entry.filename;
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
      enabled: !!selectedFile && !!originalRef,
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
          path: selectedFile?.entry.filename ?? "",
        },
      },
      parseAs: "text",
    },
    {
      enabled: !!selectedFile && !!modifiedRef,
    },
  );

  return (
    <Monaco
      mode="diff"
      original={{
        content: originalFileQuery.data ?? "",
        language: "plaintext",
        filename: originalFileName,
      }}
      modified={{
        content: modifiedFileQuery.data ?? "",
        language: "plaintext",
        filename: selectedFile?.entry.filename,
      }}
    />
  );
};
