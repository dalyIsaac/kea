import { Component, For } from "solid-js";
import { PullRequestPathParams } from "../routes";
import { A, useParams } from "@solidjs/router";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import {
  IconHome,
  IconMail,
  IconCalendar,
  IconSearch,
  IconSettings,
} from "~/components/ui/icons";

export const PullRequest: Component = () => {
  const params = useParams<PullRequestPathParams>();

  return (
    <SidebarProvider>
      <PullRequestSidebar />

      <main>
        <SidebarTrigger />

        <div>Hello, world!</div>
      </main>
    </SidebarProvider>
  );
};

const items = [
  {
    title: "Home",
    url: "#",
    icon: IconHome,
  },
  {
    title: "Inbox",
    url: "#",
    icon: IconMail,
  },
  {
    title: "Calendar",
    url: "#",
    icon: IconCalendar,
  },
  {
    title: "Search",
    url: "#",
    icon: IconSearch,
  },
  {
    title: "Settings",
    url: "#",
    icon: IconSettings,
  },
];

const PullRequestSidebar: Component = () => (
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <For each={items}>
              {(item) => (
                <SidebarMenuItem>
                  <SidebarMenuButton as={A} href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </For>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
);
