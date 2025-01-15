import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AppHeader } from "~/components/app-header";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="min-h-0 flex-1">
        <Outlet />
      </div>

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
