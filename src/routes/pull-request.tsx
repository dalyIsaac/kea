import { Component } from "solid-js";
import { PullRequestRouteParams } from "../routes";
import { useParams } from "@solidjs/router";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/tabs";
import { FileTree } from "~/components/common/file-tree";
import { createPullRequestFilesQuery } from "~/queries";

export const PullRequest: Component = () => {
  const params = useParams<PullRequestRouteParams>();
  const filesQuery = createPullRequestFilesQuery(params);

  return (
    <Tabs defaultValue="files" class="w-60">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="timeline">Timeline </TabsTrigger>
      </TabsList>

      <TabsContent value="files">
        <FileTree files={filesQuery.data?.data ?? []} />
      </TabsContent>
      <TabsContent value="timeline">Timeline Tab</TabsContent>
    </Tabs>
  );
};
