import { useParams } from "@solidjs/router";
import { Component } from "solid-js";
import { FileTree } from "~/components/common/file-tree";
import { createCommitQuery } from "~/queries";
import { CommitRouteParams } from "~/routes";

export const Commit: Component = () => {
  const params = useParams<CommitRouteParams>();
  const commitQuery = createCommitQuery(params, params.commit);

  return (
    <div class="flex gap-2">
      <FileTree files={commitQuery.data?.data.files ?? []} />
    </div>
  );
};
