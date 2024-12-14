/* @refresh reload */
// @ts-expect-error It's a font.
import "@fontsource/inter";
import "./index.css";

import { render } from "solid-js/web";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Router } from "@solidjs/router";
import { routes } from "./routes";

const root = document.getElementById("root");
const client = new QueryClient();

render(
  () => (
    <QueryClientProvider client={client}>
      <Router>{routes}</Router>
    </QueryClientProvider>
  ),
  root!,
);
