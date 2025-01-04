import { Component, createEffect } from "solid-js";
import {
  createOwnerCrumb,
  createPullCrumb,
  createPullsListCrumb,
  createRepoCrumb,
  setCrumbs,
} from "~/components/common/crumbs";
import { Page } from "~/components/common/page";
import { Details } from "~/components/pull-request/details";
import { usePullRequestDetails } from "~/components/pull-request/utils";

const PullRequest: Component = () => {
  const [details, params] = usePullRequestDetails();

  createEffect(() => {
    const data = details.data?.data;

    setCrumbs([
      createOwnerCrumb(params.owner, data?.owner ?? params.owner),
      createRepoCrumb(params.owner, params.repo, data?.repo ?? params.repo),
      createPullsListCrumb(params.owner, params.repo),
      createPullCrumb(params.owner, params.repo, params.pull),
    ]);
  });

  return (
    <div class="flex h-full gap-2">
      <Details />
      {/* <Pane class="w-1/3" />
      <Pane class="w-1/6" />
      <Pane class="w-1/6" /> */}
    </div>
  );
};

const PullRequestRoute = () => (
  <Page>
    <PullRequest />
  </Page>
);

export default PullRequestRoute;
