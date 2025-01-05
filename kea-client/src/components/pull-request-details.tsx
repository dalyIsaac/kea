import { Box, Text } from "@primer/react";
import { FC } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { components } from "~/api/openapi.g";

export const PullRequestDetails: FC<{
  details: components["schemas"]["KeaPullRequestDetails"] | undefined;
}> = ({ details }) => {
  if (!details) {
    // TODO: Loading state using skeleton text
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, padding: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Text sx={{ fontSize: 22, fontWeight: "bold" }}>{details.title}</Text>
        <Text sx={{ fontSize: 22, fontWeight: "light" }}>
          #{details.number}
        </Text>
      </Box>

      <Box className="markdown-body">
        <Markdown remarkPlugins={[remarkGfm]}>{details.body}</Markdown>
      </Box>
    </Box>
  );
};
