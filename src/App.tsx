import { useParams } from "@solidjs/router";
import { PullRequestPathParams } from "./routes";
import { Files } from "./Files";

import { personalAccessToken, setApi } from "./queries";
import { Editor } from "./components/editor/Editor";
import { PullRequest } from "./pages/pull-request";
import { TopBar } from "./components/widgets/top-bar";

function App() {
  const params = useParams<PullRequestPathParams>();

  return (
    // <div style={{ height: "80vh", width: "80vw" }}>
    //   <label for="personalAccessToken">Personal Access Token</label>
    //   <input
    //     id="personalAccessToken"
    //     type="text"
    //     value={personalAccessToken()}
    //     onInput={(e) => setApi(e.currentTarget.value)}
    //   />

    //   <Files params={params} />
    //   <Editor params={params} />
    // </div>

    <div class="flex flex-col">
      <TopBar />

      <div class="mx-2 flex flex-row">
        <PullRequest />
      </div>
    </div>
  );
}

export default App;
