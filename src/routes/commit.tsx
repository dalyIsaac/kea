import { useParams } from "@solidjs/router";
import { Component } from "solid-js";
import { CommitPathParams } from "~/routes";

export const Commit: Component = () => {
  const params = useParams<CommitPathParams>();

  return <div>Commit</div>;
};
