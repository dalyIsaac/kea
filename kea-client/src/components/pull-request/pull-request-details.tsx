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
    <div className="markdown-body">
      <Markdown remarkPlugins={[remarkGfm]}>{details.body}</Markdown>
    </div>
  );
};
