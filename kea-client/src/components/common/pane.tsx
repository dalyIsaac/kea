import { ParentComponent, splitProps } from "solid-js";
import { cn } from "~/lib/utils";

export const Pane: ParentComponent<{ class?: string }> = (props) => {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <div
      class={cn("flex flex-col gap-2 rounded-lg p-2 shadow-pane", local.class)}
      {...others}
    >
      {props.children}
    </div>
  );
};
