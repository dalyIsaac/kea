import { createLink } from "@tanstack/react-router";
import styled from "styled-components";
import { Button } from "~/shadcn/ui/button";

export const SegmentedLinkContainer = styled.div`
  display: inline-flex;
  gap: 1px;
`;

const StyledLink = styled(Button).attrs({ variant: "ghost", size: "sm" })`
  &[data-status="active"] {
    background-color: hsl(var(--muted));
    font-weight: 600;
  }
`;

export const SegmentedLink = createLink(StyledLink);
