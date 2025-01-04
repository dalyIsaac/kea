import { A } from "@solidjs/router";
import LogInIcon from "lucide-solid/icons/log-in";
import SettingsIcon from "lucide-solid/icons/settings";
import { Component, FlowComponent } from "solid-js";
import { createMeQuery } from "~/api/api";
import { Crumbs } from "~/components/common/crumbs";
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

export const Page: FlowComponent = (props) => (
  <div class="flex h-full flex-col">
    <TopBar />

    <div class="flex-1 overflow-y-auto p-2">{props.children}</div>
  </div>
);

const TopBar: Component = () => {
  return (
    <header class="flex h-12 w-full items-center justify-between p-2 shadow-sm">
      <div class="flex items-center gap-2">
        <A href="/">
          <img class="size-12" src="/kea.png" alt="Kea logo" />
        </A>

        <Crumbs />
      </div>

      <RightSide />
    </header>
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
