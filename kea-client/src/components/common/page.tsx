import { A, useCurrentMatches } from "@solidjs/router";
import { Component, FlowComponent, For } from "solid-js";
import { isKeaRouteDefinition } from "~/routes";

export const Page: FlowComponent = (props) => (
  <div class="flex h-full flex-col">
    <TopBar />

    <div class="flex-1 overflow-y-auto">{props.children}</div>
  </div>
);

const TopBar: Component = () => {
  return (
    <header class="mb-2 flex h-12 w-full items-center gap-2 border-b p-2">
      <A href="/">
        <img class="h-12 w-12" src="/kea.png" alt="Kea logo" />
      </A>

      <BreadCrumbs />
    </header>
  );
};

const BreadCrumbs: Component = () => {
  const matches = useCurrentMatches();
  const parts = () => {
    const p: Array<{ title: string; url: string; isLast?: boolean }> = [];
    for (const match of matches()) {
      const route = match.route;

      if (!isKeaRouteDefinition(route)) {
        continue;
      }

      if (typeof route.info.title === "string") {
        p.push({ title: route.info.title, url: match.path });
      } else {
        const result = route.info.title(match.params);

        if (typeof result === "string") {
          p.push({ title: result, url: match.path });
        } else {
          p.push(...result);
        }
      }
    }

    if (p.length > 0) {
      p[p.length - 1]!.isLast = true;
    }
    return p;
  };

  return (
    <For each={parts()}>
      {(part) => (
        <div class="flex items-center gap-2">
          <a href={part.url}>{part.title}</a>

          {!part.isLast && <span>&gt;</span>}
        </div>
      )}
    </For>
  );
};
