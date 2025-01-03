import { useParams } from "@solidjs/router";
import { createPullRequestDetailsQuery } from "~/api/api";
import { PullRequestRouteParams } from "~/routes";

export const usePullRequestDetails = (): [
  ReturnType<typeof createPullRequestDetailsQuery>,
  PullRequestRouteParams,
] => {
  const params = useParams<PullRequestRouteParams>();
  const query = createPullRequestDetailsQuery(
    params.owner,
    params.repo,
    parseInt(params.pull),
  );

  return [query, params];
};
