import { $api } from "~/api/api";
import { GetPullRequestFilesParams } from "~/api/types";
import { DiffTree } from "~/components/diff-tree/diff-tree";

export const PullRequestDiffTree: React.FC<{ params: GetPullRequestFilesParams }> = ({
  params,
}) => {
  const filesQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}/files", {
    params: {
      path: params,
    },
  });

  return <DiffTree data={filesQuery.data} />;
};
