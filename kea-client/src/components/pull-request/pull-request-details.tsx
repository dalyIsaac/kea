import { Box } from "@primer/react";
import { FC } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as apiTypes from "~/api/types";

export const PullRequestDetails: FC<{
  details: apiTypes.PullRequestDetails | undefined;
}> = ({ details }) => {
  if (!details) {
    // TODO: Loading state using skeleton text
    return null;
  }

  return (
    <Box className="markdown-body">
      <Markdown remarkPlugins={[remarkGfm]}>{details.body}</Markdown>
    </Box>
  );
};
