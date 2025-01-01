import { Link } from "@kobalte/core/link";
import { Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/shadcn/tooltip";

export const IconButtonLink: Component<{
  href: string;
  icon: Component<{ class: string }>;
  tooltip: string;
  iconClass?: string;
}> = (props) => {
  const iconClass = props.iconClass || "size-4";

  return (
    <Tooltip>
      <TooltipTrigger as={Link} variant="ghost" href={props.href}>
        <Dynamic component={props.icon} class={iconClass} />
      </TooltipTrigger>

      <TooltipContent>
        <div>{props.tooltip}</div>
      </TooltipContent>
    </Tooltip>
  );
};
