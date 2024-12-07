import { Component, ErrorBoundary, Suspense } from "solid-js";
import { createPullRequestFilesQuery } from "~/queries";
import { PullRequestPathParams } from "~/routes";
import { FileTree } from "~/components/common/file-tree";

export const Files: Component<{ params: PullRequestPathParams }> = (props) => {
  const pullRequestFilesQuery = createPullRequestFilesQuery(props.params);
  return (
    <ErrorBoundary
      fallback={(error) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{error.message}</pre>
        </div>
      )}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <FileTree files={pullRequestFilesQuery.data?.data || []} />
      </Suspense>
    </ErrorBoundary>
  );
};
