import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AppHeader } from "~/components/app-header";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="flex-1 min-h-0">
        <Outlet />
      </div>

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}
