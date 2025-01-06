import { createFileRoute } from "@tanstack/react-router";
import { Monaco } from "~/components/monaco/monaco";

export const Route = createFileRoute(
  "/$provider/$owner/$repo/pull/$prId/_pull/review",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello "/$provider/$owner/$repo/pull/$prId/review"!
      <Monaco />
    </div>
  );
}
