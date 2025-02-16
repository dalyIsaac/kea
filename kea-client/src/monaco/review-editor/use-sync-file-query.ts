import React from "react";
import { $api } from "~/api/api";
import { Editor } from "~/monaco";
import { ReviewEditorModel } from "./review-editor-model";

/**
 * Fetches a file from the GitHub API and updates the provided Monaco text model.
 * @param owner The owner of the repository.
 * @param repo The repository name.
 * @param ref The Git ref to fetch the file from.
 * @param path The path to the file.
 * @param canProceed Whether the query can proceed.
 * @param sideModel The side model to update with the fetched file.
 */
export const useSyncFileQuery = (
  owner: string,
  repo: string,
  ref: string | undefined,
  path: string | undefined | null,
  canProceed: boolean,
  editor: Editor | null,
  reviewEditorModel: ReviewEditorModel | undefined,
  side: "original" | "modified",
) => {
  // Unused state to force a re-render when the data is loaded
  const [, setHasLoaded] = React.useState(false);

  const result = $api.useQuery(
    "get",
    "/github/{owner}/{repo}/file/{git_ref}/{path}",
    {
      params: {
        path: {
          owner,
          repo,
          git_ref: ref ?? "",
          path: path ?? "",
        },
      },
      parseAs: "text",
    },
    {
      enabled: ref !== undefined && path !== undefined && canProceed,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );

  React.useEffect(() => {
    if (editor !== null && reviewEditorModel && result.data !== undefined) {
      reviewEditorModel.setText(editor, result.data, side);
      setHasLoaded(true);
    }
  }, [editor, result.data, reviewEditorModel, setHasLoaded, side]);
};
