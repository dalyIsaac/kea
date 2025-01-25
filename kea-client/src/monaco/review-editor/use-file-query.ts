import React from "react";
import { $api } from "~/api/api";
import { monaco } from "~/monaco";

export const useFileQuery = (
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
      enabled: !!ref && !!path && canProceed,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );

  React.useEffect(() => {
    if (textModel && result.data) {
      textModel.setValue(result.data);
      setHasLoaded(true);
    }
  }, [result.data, setHasLoaded, textModel]);
};
