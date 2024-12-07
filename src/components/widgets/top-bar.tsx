import { A } from "@solidjs/router";
import { Component } from "solid-js";

export const TopBar: Component = () => (
  <header class="mb-2 flex h-12 w-full items-center gap-2 border-b p-2">
    <img class="h-12 w-12" src="/kea.png" alt="Kea logo" />
    <A href="/" class="text-2xl font-bold">
      kea
    </A>
  </header>
);