import { Header as PrimerHeader, themeGet } from "@primer/react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { FC } from "react";
import styled from "styled-components";
import logo from "~/assets/logo-light.gif";

const Header = styled(PrimerHeader)`
  background: ${themeGet("colors.pageHeaderBg")};
`;

const RootComponent: FC = () => {
  return (
    <>
      <Header sx={{ bg: "colors.pageHeaderBg" }}>
        <Header.Item>
          <Header.Link href="/">
            <img
              src={logo}
              alt="Kea Logo"
              style={{ imageRendering: "pixelated", height: 32 }}
            />
          </Header.Link>
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
