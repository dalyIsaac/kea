import { Box, Text, themeGet } from "@primer/react";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import styled from "styled-components";

export const PullRequestTitle: FC<{
  title: string | undefined | null;
  id: number;
}> = ({ title, id }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Text sx={{ fontSize: 22, fontWeight: "bold" }}>{title}</Text>
    <Text sx={{ fontSize: 22, fontWeight: "light" }}>#{id}</Text>
  </Box>
);

const NavItem = styled(Link)`
  color: ${themeGet("colors.fg.muted")};
  text-decoration: none;
  padding: 8px 16px;
  font-size: 14px;
  line-height: 20px;
  position: relative;
  border: 1px solid transparent;
  border-radius: 6px 6px 0 0;
  margin-bottom: -1px;
  background-color: ${themeGet("colors.canvas.subtle")};
  margin-right: 1px;

  &:hover {
    color: ${themeGet("colors.fg.default")};
    background-color: ${themeGet("colors.canvas.default")};
  }

  &[data-status="active"] {
    color: ${themeGet("colors.fg.default")};
    font-weight: 600;
    background-color: ${themeGet("colors.canvas.default")};
    border-color: ${themeGet("colors.border.default")};
    border-bottom-color: ${themeGet("colors.canvas.default")};
  }
`;

export const PullRequestNav: FC = () => (
  <Box
    sx={{
      display: "flex",
      px: 3,
      pt: 2,
    }}
  >
    <NavItem to="/$provider/$owner/$repo/pull/$prId">Overview</NavItem>
    <NavItem to="/$provider/$owner/$repo/pull/$prId/review">Review</NavItem>
  </Box>
);
