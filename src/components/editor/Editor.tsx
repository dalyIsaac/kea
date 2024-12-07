import { Component } from "solid-js";
import { PullRequestPathParams } from "../../routes";
import {
  createFileBlobQuery,
  createPullRequestDetailsQuery,
} from "../../queries";
import { MonacoDiffEditor } from "./MonacoDiffEditor";

export const Editor: Component<{ params: PullRequestPathParams }> = (props) => {
  const pullRequestDetailsQuery = createPullRequestDetailsQuery(props.params);
  const originalFileBlobQuery = createFileBlobQuery(
    props.params,
    pullRequestDetailsQuery.data?.data.head.sha,
    pullRequestDetailsQuery.data?.data.head.repo?.full_name,
  );

  const modifiedFileBlobQuery = createFileBlobQuery(
    props.params,
    pullRequestDetailsQuery.data?.data.base.sha,
    pullRequestDetailsQuery.data?.data.base.repo?.full_name,
  );

  return (
    <div style={{ height: "80vh", width: "80vw" }}>
      <MonacoDiffEditor
        original={originalFileBlobQuery.data?.data.content ?? ""}
        modified={modifiedFileBlobQuery.data?.data.content ?? ""}
      />
    </div>
  );
};
