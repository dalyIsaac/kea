import { Component, splitProps } from "solid-js";
import { Pane } from "~/components/common/pane";
import { usePullRequestDetails } from "~/components/pull-request/utils";

export const Details: Component<{ class: string }> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  const [details] = usePullRequestDetails();

  return (
    <Pane class={local.class}>
      {/* Header */}
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-semibold leading-none tracking-tight">
          {details.data?.data?.title}
        </h3>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-muted-foreground">
            #{details.data?.data?.number}
          </span>
        </div>
      </div>

      {/* Description */}
      <p class="overflow-auto text-sm text-muted-foreground">
        {details.data?.data?.body}
      </p>
    </Pane>
  );
};
