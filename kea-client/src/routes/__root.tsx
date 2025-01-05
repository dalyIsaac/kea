import { Button, Header } from "@primer/react";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { FC } from "react";
import logo from "~/assets/logo-light.gif";

const RootComponent: FC = () => {
  return (
    <>
      <Header sx={{ display: "flex", justifyContent: "space-between" }}>
        <Header.Item>
          <Header.Link href="/">
            <img
              src={logo}
              alt="Kea Logo"
              style={{ imageRendering: "pixelated", height: 32 }}
            />
          </Header.Link>
        </Header.Item>

        <Header.Item sx={{ mr: 0 }}>
          <Button as={Link} to="http://localhost:3000/github/signin">
            Sign In
          </Button>
        </Header.Item>
      </Header>

      <Outlet />

      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
