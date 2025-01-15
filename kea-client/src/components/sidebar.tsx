export const SidebarHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <header className="flex justify-between items-center h-7 px-1 border-b">{children}</header>
);

export const SidebarTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-semibold">{children}</h2>
);

export const SidebarTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button className="flex items-center justify-between w-full px-4 py-2 text-left">
    {children}
  </button>
);

export const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <aside className="flex-none w-60 bg-background border-r border-border">{children}</aside>
);
