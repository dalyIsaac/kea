import { Avatar, Button, Header } from "@primer/react";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactElement, ReactNode } from "react";
import { $api } from "~/api/api";
import logo from "~/assets/logo-light.gif";
import { AppCrumbs } from "~/components/app-crumbs/app-crumbs";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { isLoading, data } = $api.useQuery("get", "/me");

  let user: ReactNode = null;

  if (!isLoading) {
    let content: ReactElement;

    if (data?.github) {
      content = <Avatar src={data.github.avatar_url} alt={data.github.login} size={32} />;
    } else {
      content = (
        <Button as={Link} to="http://localhost:3000/github/signin">
          Sign In
        </Button>
      );
    }

    user = <Header.Item>{content}</Header.Item>;
  }

  return (
    <>
      <Header
        sx={{
          display: "flex",
          justifyContent: "space-between",
          bg: "pageHeaderBg",
          color: "header.bg",
        }}
      >
        <Header.Item sx={{ display: "flex", gap: 2 }}>
          <Header.Link href="/">
            <img src={logo} alt="Kea Logo" style={{ imageRendering: "pixelated", height: 32 }} />
          </Header.Link>

          <AppCrumbs />
        </Header.Item>

        <Header.Item sx={{ mr: 0 }}>{user}</Header.Item>
      </Header>

      <Outlet />

      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
