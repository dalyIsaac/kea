import { themeGet } from "@primer/react";
import { createLink } from "@tanstack/react-router";
import styled from "styled-components";

/**
 * A container for a segmented link. Based on the Primer SegmentedControl.
 */
export const SegmentedLinkContainer = styled.div`
  display: inline-flex;
  background-color: ${themeGet("colors.canvas.subtle")};
  border: 1px solid ${themeGet("colors.border.default")};
  border-radius: 6px;
`;

const StyledLink = styled.a`
  padding: 5px 12px;
  font-size: 12px;
  line-height: 20px;
  text-decoration: none;
  color: ${themeGet("colors.fg.muted")};
  background-color: ${themeGet("colors.neutral.subtle")};
  border-right: 1px solid ${themeGet("colors.border.default")};

  &:first-child {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  &:last-child {
    border-right: none;
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
  }

  &:hover {
    background-color: ${themeGet("colors.neutral.muted")};
    color: ${themeGet("colors.fg.default")};
  }

  &[data-status="active"] {
    color: ${themeGet("colors.fg.default")};
    background-color: ${themeGet("colors.canvas.default")};
    font-weight: 600;
  }
`;

/**
 * A segmented link. Based on the Primer SegmentedControl.
 */
export const SegmentedLink = createLink(StyledLink);
