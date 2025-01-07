import { Box } from "@primer/react";
import { Link } from "@tanstack/react-router";
import { atom, useAtom } from "jotai";
import { FC } from "react";

export interface Crumb {
  text: string;
  href: string;
}

export const appCrumbs = atom<Crumb[]>([]);

export const AppCrumbs: FC = () => {
  const [crumbs] = useAtom(appCrumbs);

  return (
    <Box
      as="ul"
      sx={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: 1 }}
    >
      {crumbs.map((crumb, i) => (
        <Box as="li" key={i} sx={{ display: "flex", gap: 1 }}>
          {i === 0 ? null : (
            <Box as="span" sx={{ color: "text.secondary", userSelect: "none" }}>
              /
            </Box>
          )}

          <Link to={crumb.href}>{crumb.text}</Link>
        </Box>
      ))}
    </Box>
  );
};
