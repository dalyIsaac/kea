import { FC, ReactNode } from "react";

export const SidebarHeader: FC<{ children: ReactNode }> = ({ children }) => (
  <header className="flex justify-between items-center h-7 px-1 border-b">{children}</header>
);

export const SidebarTitle: FC<{ children: ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-semibold">{children}</h2>
);

export const SidebarSection: FC<{ children: ReactNode }> = ({ children }) => (
  <section className="p-4">{children}</section>
);

export const SidebarTrigger: FC<{ children: ReactNode }> = ({ children }) => (
  <button className="flex items-center justify-between w-full px-4 py-2 text-left">
    {children}
  </button>
);

export const Sidebar: FC<{ children: ReactNode }> = ({ children }) => (
  <aside className="flex-none w-60 bg-background border-r border-border">{children}</aside>
);
