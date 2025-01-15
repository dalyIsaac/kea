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
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactElement;
}

export const DiffTreeBaseNode = <T extends ParentEntryNode | LeafEntryNode>({
  node,
  ariaExpanded,
  onClick,
  onKeyDown,
  leftIcon,
  rightIcon,
  children,
  tabIndex = 0,
}: DiffTreeBaseNodeProps<T>): React.ReactElement => (
  <div className="select-none text-center text-xs">
    <div
      role="treeitem"
      aria-expanded={ariaExpanded}
      tabIndex={tabIndex}
      className={cn(
        "my-0.5 ml-0.5 flex items-center gap-1 rounded px-1 py-0.5 hover:bg-gray-100",
        "cursor-pointer outline-none focus:bg-gray-100 focus:ring-1 focus:ring-gray-300",
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span className="flex w-4 items-center justify-center">{leftIcon}</span>
      <span className="flex-grow text-left text-gray-700">
        {node.entry.filename.split("/").pop()}
      </span>
      <span className="flex w-4 items-center justify-center">{rightIcon}</span>
    </div>
    {children}
  </div>
);
