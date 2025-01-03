import { Component, createEffect } from "solid-js";
import { PullRequestRouteParams } from "../routes";
import { useParams } from "@solidjs/router";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/tabs";
import { Page } from "~/components/common/page";
import {
  createOwnerCrumb,
  createPullCrumb,
  createPullsListCrumb,
  createRepoCrumb,
  setCrumbs,
} from "~/components/common/crumbs";
import { createPullRequestDetailsQuery } from "~/api/api";

const PullRequest: Component = () => {
  const params = useParams<PullRequestRouteParams>();
  const detailsQuery = createPullRequestDetailsQuery(
    params.owner,
    params.repo,
    parseInt(params.pull),
  );

  createEffect(() => {
    const data = detailsQuery.data?.data;

    setCrumbs([
      createOwnerCrumb(params.owner, data?.owner ?? params.owner),
      createRepoCrumb(params.owner, params.repo, data?.repo ?? params.repo),
      createPullsListCrumb(params.owner, params.repo),
      createPullCrumb(params.owner, params.repo, params.pull),
    ]);
  });

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
