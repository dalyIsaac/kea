import { CheckIcon } from "@primer/octicons-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";
import styled from "styled-components";

const StyledRoot = styled(CheckboxPrimitive.Root)`
  width: 16px;
  height: 16px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #0969da;
  }

  &:focus-visible {
    outline: 2px solid #0969da;
    outline-offset: 0;
  }

  &[data-state="checked"] {
    background: #0969da;
    border-color: #0969da;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledIndicator = styled(CheckboxPrimitive.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <StyledRoot ref={ref} className={className} {...props}>
    <StyledIndicator>
      <CheckIcon size={12} />
    </StyledIndicator>
  </StyledRoot>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
