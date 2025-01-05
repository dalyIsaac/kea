import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/$provider/$owner/$repo/pull/$prId/review",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$provider/$owner/$repo/pull/$prId/review"!</div>;
}
