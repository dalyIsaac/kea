import { cn } from "~/lib/utils";

export const SidebarHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <header className="flex h-7 items-center justify-between border-b px-1">{children}</header>
);

export const SidebarTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-semibold">{children}</h2>
);

export const Sidebar: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <aside className={cn("flex-none border-r border-border bg-background", className)}>
    {children}
  </aside>
);
