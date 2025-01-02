/* @refresh reload */
// @ts-expect-error It's a font.
import "@fontsource/monaspace-neon";
import "./index.css";

import { render } from "solid-js/web";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { KeaRouter } from "./routes";

const root = document.getElementById("root");
const client = new QueryClient();

render(
  () => (
    <QueryClientProvider client={client}>
      <KeaRouter />
    </QueryClientProvider>
  ),
  root!,
);
