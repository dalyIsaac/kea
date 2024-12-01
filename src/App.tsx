import { createSignal, ErrorBoundary, Suspense } from "solid-js";
import "./App.css";
import { makePersisted } from "@solid-primitives/storage";
import { createQuery } from "@tanstack/solid-query";

const [api, setApi] = makePersisted(createSignal("https://api.github.com"), {
  storage: localStorage,
});
const [personalAccessToken, setPersonalAccessToken] = makePersisted(
  createSignal(""),
  { storage: localStorage }
);

function App() {
  const repositoryQuery = createQuery(() => ({
    enabled: !!personalAccessToken(),
    queryKey: ["repositories"],
    queryFn: async () => {
      const response = await fetch(`${api()}/users/dalyisaac/repos`, {
        headers: {
          Authorization: `token ${personalAccessToken()}`,
        },
      });
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    throwOnError: true,
  }));

  return (
    <div>
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
            {repositoryQuery.data?.map((repo: any) => (
              <li>{repo.full_name}</li>
            ))}
          </ul>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
