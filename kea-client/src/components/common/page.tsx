import { A, useCurrentMatches } from "@solidjs/router";
import { Component, FlowComponent, For } from "solid-js";
import { createMeQuery } from "~/api/api";
import { IconButtonLink } from "~/components/common/icon-button-link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/shadcn/dropdown-menu";
import { isKeaRouteDefinition } from "~/routes";
import LogInIcon from "lucide-solid/icons/log-in";
import SettingsIcon from "lucide-solid/icons/settings";

export const Page: FlowComponent = (props) => (
  <div class="flex h-full flex-col">
    <TopBar />

    <div class="flex-1 overflow-y-auto">{props.children}</div>
  </div>
);

const TopBar: Component = () => {
  return (
    <header class="mb-2 flex h-12 w-full items-center justify-between border-b p-2">
      <div class="flex items-center gap-2">
        <A href="/">
          <img class="size-12" src="/kea.png" alt="Kea logo" />
        </A>

        <BreadCrumbs />
      </div>

      <RightSide />
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

const RightSide: Component = () => {
  const meQuery = createMeQuery();
  const avatarProps = () => {
    if (meQuery.data?.data?.github) {
      const githubData = meQuery.data.data.github;
      return {
        src: `https://avatars.githubusercontent.com/u/${githubData.id}`,
        alt: githubData.login.toUpperCase().slice(0, 2),
      };
    }

    return undefined;
  };

  return (
    <>
      {avatarProps() ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            {avatarProps() ? (
              <Avatar>
                <AvatarImage
                  src={avatarProps()?.src}
                  class="size-10 fade-in-5"
                />
                <AvatarFallback>{avatarProps()?.alt}</AvatarFallback>
              </Avatar>
            ) : (
              <IconButtonLink
                href="/settings"
                icon={LogInIcon}
                tooltip="Sign in"
              />
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem as={A} href="/settings">
              <SettingsIcon class="size-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <IconButtonLink
          href="/settings"
          icon={SettingsIcon}
          tooltip="Sign in"
        />
      )}
    </>
  );
};
