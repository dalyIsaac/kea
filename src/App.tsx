import { createSignal, ErrorBoundary, Suspense } from "solid-js";
import "./App.css";
import { makePersisted } from "@solid-primitives/storage";
import { createQuery } from "@tanstack/solid-query";
import { MonacoDiffEditor } from "./editor/MonacoDiffEditor";
import { useParams } from "@solidjs/router";
import { PullRequestPathParams } from "./routes";

const [api, setApi] = makePersisted(createSignal("https://api.github.com"), {
  storage: localStorage,
});
const [personalAccessToken, setPersonalAccessToken] = makePersisted(
  createSignal(""),
  { storage: localStorage }
);

function App() {
  const params = useParams<PullRequestPathParams>();

  const pullRequestDetailsQuery = createQuery(() => ({
    enabled: !!personalAccessToken(),
    queryKey: ["pullRequestDetails", params.repo, params.owner, params.pull],
    queryFn: async () => {
      const response = await fetch(
        `${api()}/repos/${params.owner}/${params.repo}/pulls/${params.pull}`,
        {
          headers: {
            Authorization: `token ${personalAccessToken()}`,
          },
        }
      );
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    throwOnError: true,
  }));

  const pullRequestFilesQuery = createQuery(() => ({
    enabled: !!personalAccessToken(),
    queryKey: ["pullRequestFiles", params.repo, params.pull],
    queryFn: async () => {
      const response = await fetch(
        `${api()}/repos/${params.owner}/${params.repo}/pulls/${
          params.pull
        }/files`,
        {
          headers: {
            Authorization: `token ${personalAccessToken()}`,
          },
        }
      );
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    throwOnError: true,
  }));

  // Get the first file's content
  const firstFileBlobQuery = createQuery(() => ({
    enabled:
      !!personalAccessToken() &&
      !!pullRequestFilesQuery.data &&
      !!pullRequestDetailsQuery.data,
    queryKey: ["firstFileBlob", params.repo, params.pull],
    queryFn: async () => {
      const files = pullRequestFilesQuery.data;
      const firstFile = files[0];
      const prDetails = pullRequestDetailsQuery.data;

      // Get both modified and original content
      const [modifiedResponse, originalResponse] = await Promise.all([
        fetch(
          `${api()}/repos/${params.owner}/${params.repo}/contents/${
            firstFile.filename
          }?ref=${prDetails.head.sha}`,
          {
            headers: {
              Authorization: `token ${personalAccessToken()}`,
              Accept: "application/vnd.github.v3.raw",
            },
          }
        ),
        fetch(
          `${api()}/repos/${params.owner}/${params.repo}/contents/${
            firstFile.filename
          }?ref=${prDetails.base.sha}`,
          {
            headers: {
              Authorization: `token ${personalAccessToken()}`,
              Accept: "application/vnd.github.v3.raw",
            },
          }
        ),
      ]);

      const [modified, original] = await Promise.all([
        modifiedResponse.text(),
        originalResponse.text(),
      ]);

      return { modified, original };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    throwOnError: true,
  }));

  return (
    <div style={{ height: "80vh", width: "80vw" }}>
      <label for="api">API</label>
      <input
        id="api"
        type="text"
        value={api()}
        onInput={(e) => setApi(e.currentTarget.value)}
      />

      <label for="personalAccessToken">Personal Access Token</label>
      <input
        id="personalAccessToken"
        type="text"
        value={personalAccessToken()}
        onInput={(e) => setPersonalAccessToken(e.currentTarget.value)}
      />

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
            {pullRequestFilesQuery.data?.map((file: any) => (
              <li>{file.filename}</li>
            ))}
          </ul>
        </Suspense>
      </ErrorBoundary>

      <MonacoDiffEditor
        original={firstFileBlobQuery.data?.original ?? ""}
        modified={firstFileBlobQuery.data?.modified ?? ""}
      />
    </div>
  );
}

export default App;
