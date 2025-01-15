import { cn } from "~/lib/utils";
import { LeafEntryNode, ParentEntryNode } from "~/state/file-tree/types";

export interface BaseProps {
  tabIndex?: number;
}

export interface DiffTreeBaseNodeProps<T extends ParentEntryNode | LeafEntryNode>
  extends BaseProps {
  node: T;
  ariaExpanded?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  icon?: React.ReactNode;
  children?: React.ReactElement;
}

export const DiffTreeBaseNode = <T extends ParentEntryNode | LeafEntryNode>({
  node,
  ariaExpanded,
  onClick,
  onKeyDown,
  icon,
  children,
  tabIndex = 0,
}: DiffTreeBaseNodeProps<T>): React.ReactElement => (
  <div className="my-0.5 select-none text-center font-mono text-xs">
    <div
      role="treeitem"
      aria-expanded={ariaExpanded}
      tabIndex={tabIndex}
      className={cn(
        "flex items-center justify-between gap-1 rounded px-2 py-0.5 hover:bg-gray-100",
        "cursor-pointer outline-none focus:bg-gray-100 focus:ring-1 focus:ring-gray-300",
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span className="text-gray-700">{node.entry.filename.split("/").pop()}</span>

      <span className="flex items-center gap-1">
        <span className="flex w-4 items-center justify-center">{icon}</span>
      </span>
    </div>

    {children}
  </div>
);
