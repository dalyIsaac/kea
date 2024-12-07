import { Component, ErrorBoundary, Suspense } from "solid-js";
import { PullRequestPathParams } from "./routes";
import { createPullRequestFilesQuery } from "./queries";

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
        <ul>
          {pullRequestFilesQuery.data?.data.map((file) => (
            <li>{file.filename}</li>
          ))}
        </ul>
      </Suspense>
    </ErrorBoundary>
  );
};
