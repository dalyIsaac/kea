import { $api } from "~/api/api";
import { GetPullRequestDetailsParams } from "~/api/types";
import { DiffViewer } from "~/components/diff-viewer";

export const PullRequestDiffViewer: React.FC<{ params: GetPullRequestDetailsParams }> = ({
  params,
}) => {
  const prQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}", {
    params: {
      path: params,
    },
  });

  return (
    <DiffViewer
      owner={params.owner}
      repo={params.repo}
      originalRef={prQuery.data?.base.sha}
      modifiedRef={prQuery.data?.head.sha}
    />
  );
};
