import { Box, Text } from "@primer/react";
import { createFileRoute } from "@tanstack/react-router";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { $api } from "~/api/api";
import { validatePrId, validateProvider } from "~/utils/validate-routes";

export const Route = createFileRoute("/$provider/$owner/$repo/pull/$prId")({
  component: PullRequestComponent,
  params: {
    parse: (params) => {
      return {
        provider: validateProvider(params.provider),
        owner: params.owner,
        repo: params.repo,
        prId: validatePrId(params.prId),
      };
    },
  },
});

function PullRequestComponent() {
  const { owner, repo, prId } = Route.useParams();

  const details = $api.useQuery(
    "get",
    "/github/{owner}/{repo}/pull/{pr_number}",
    {
      params: {
        path: {
          owner,
          repo,
          pr_number: prId,
        },
      },
    },
  );

  return (
    <Box>
      <Box>
        <Text size="large">{details.data?.title}</Text>
        <Text size="large">{details.data?.id}</Text>
      </Box>

      <div className="markdown-body">
        <Markdown remarkPlugins={[remarkGfm]}>{details.data?.body}</Markdown>
      </div>
    </Box>
  );
}
