import { Component, For } from "solid-js";
import { PullRequestPathParams } from "../routes";
import { A, useParams } from "@solidjs/router";
import {
  IconHome,
  IconMail,
  IconCalendar,
  IconSearch,
  IconSettings,
} from "~/components/shadcn/icons";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/tabs";
import { Files } from "~/components/widgets/files";

export const PullRequest: Component = () => {
  const params = useParams<PullRequestPathParams>();

  return (
    <Tabs defaultValue="files" class="w-60">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="timeline">Timeline </TabsTrigger>
      </TabsList>

      <TabsContent value="files">
        <Files params={params} />
      </TabsContent>
      <TabsContent value="timeline">Timeline Tab</TabsContent>
    </Tabs>
  );
};
