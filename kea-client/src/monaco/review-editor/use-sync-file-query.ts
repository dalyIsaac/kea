import React from "react";
import { $api } from "~/api/api";
import { monaco } from "~/monaco";

/**
 * Fetches a file from the GitHub API and updates the provided Monaco text model.
 * @param owner The owner of the repository.
 * @param repo The repository name.
 * @param ref The Git ref to fetch the file from.
 * @param path The path to the file.
 * @param canProceed Whether the query can proceed.
 * @param textModel The Monaco text model to update.
 */
export const useSyncFileQuery = (
  owner: string,
  repo: string,
  ref: string | undefined,
  path: string | undefined | null,
  canProceed: boolean,
  textModel: monaco.editor.ITextModel | undefined,
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
    if (textModel !== undefined && result.data !== undefined) {
      textModel.setValue(result.data);
      setHasLoaded(true);
    }
  }, [result.data, setHasLoaded, textModel]);
};
