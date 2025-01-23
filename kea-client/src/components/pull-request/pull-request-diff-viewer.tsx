import { useMemo } from "react";
import { $api } from "~/api/api";
import { GetPullRequestDetailsParams } from "~/api/types";
import { DiffViewer } from "~/components/diff-viewer";
import { CommentStore } from "~/monaco/comment-store";

export const PullRequestDiffViewer: React.FC<{ params: GetPullRequestDetailsParams }> = ({
  params,
}) => {
  const prQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}", {
    params: {
      path: params,
    },
  });

  const commentsQuery = $api.useQuery("get", "/github/{owner}/{repo}/pull/{pr_number}/comments", {
    params: {
      path: params,
    },
  });

  const commentStore = useMemo(
    () => CommentStore.fromComments(commentsQuery.data),
    [commentsQuery.data],
  );

  return (
    <DiffViewer
      owner={params.owner}
      repo={params.repo}
      originalRef={prQuery.data?.base.sha}
      modifiedRef={prQuery.data?.head.sha}
      commentStore={commentStore}
    />
  );
};
