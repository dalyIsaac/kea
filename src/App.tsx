import { createSignal } from "solid-js";
import solidLogo from "./assets/solid.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { makePersisted } from "@solid-primitives/storage";

const [api, setApi] = makePersisted(createSignal("https://api.github.com"), {
  storage: localStorage,
});

function App() {
  return (
    <>
      <header class="App-header">
        <img src={solidLogo} class="App-logo" alt="logo" />
        <img src={viteLogo} class="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <input
          type="text"
          value={api()}
          onInput={(e) => setApi(e.currentTarget.value)}
        />
        <a
          class="App-link"
          href={api()}
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
    </>
  );
}

export default App;
