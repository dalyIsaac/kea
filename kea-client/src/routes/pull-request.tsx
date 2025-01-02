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
import { Page } from "~/components/common/page";

const PullRequest: Component = () => {
  const params = useParams<PullRequestRouteParams>();
  const paramsFn = () => params;

  return (
    <div class="flex gap-2">
      <Tabs defaultValue="files" class="w-60">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="timeline">Timeline </TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          {/* <FileTree files={filesQuery.data?.data ?? []} /> */}
        </TabsContent>
        <TabsContent value="timeline">Timeline Tab</TabsContent>
      </Tabs>
      Pull request information goes here
    </div>
  );
};

const PullRequestRoute = () => (
  <Page>
    <PullRequest />
  </Page>
);

export default PullRequestRoute;
