export const SidebarHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <header className="flex h-7 items-center justify-between border-b px-1">{children}</header>
);

export const SidebarTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-semibold">{children}</h2>
);

export const SidebarTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button className="flex w-full items-center justify-between px-4 py-2 text-left">
    {children}
  </button>
);

export const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <aside className="w-60 flex-none border-r border-border bg-background">{children}</aside>
);
