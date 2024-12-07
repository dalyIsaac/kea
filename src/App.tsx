import { useParams } from "@solidjs/router";
import { PullRequestPathParams } from "./routes";
import { Files } from "./Files";

import { personalAccessToken, setApi } from "./queries";
import { Editor } from "./components/editor/Editor";
import { PullRequest } from "./pages/PullRequest";

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

    <PullRequest />
  );
}

export default App;
