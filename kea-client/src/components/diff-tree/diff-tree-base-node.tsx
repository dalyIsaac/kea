import { ArrowRight, Check, Copy, Edit, Minus, Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import { LeafEntryNode, ParentEntryNode } from "~/state/file-tree/types";
import { isParentNode } from "~/state/file-tree/utils";

const iconProps = {
  size: 12,
  strokeWidth: 2.5,
};

function getIconByStatus(status: string | undefined): React.ReactNode {
  switch (status) {
    case "Added":
      return <Plus className="text-green-500" {...iconProps} />;
    case "Removed":
      return <Minus className="text-red-500" {...iconProps} />;
    case "Modified":
    case "Changed":
      return <Edit className="text-blue-500" {...iconProps} />;
    case "Renamed":
      return <ArrowRight className="text-yellow-500" {...iconProps} />;
    case "Copied":
      return <Copy className="text-purple-500" {...iconProps} />;
    case "Unchanged":
      return <Check className="text-gray-400" {...iconProps} />;
    default:
      return null;
  }
}

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
}: DiffTreeBaseNodeProps<T>): React.ReactElement => {
  const isParent = isParentNode(node);
  const statusIcon = isParent ? null : getIconByStatus(node.entry.status);

  return (
    <div className="select-none text-sm my-0.5">
      <div
        role="treeitem"
        aria-expanded={ariaExpanded}
        tabIndex={tabIndex}
        className={cn(
          "flex items-center justify-between gap-1 hover:bg-gray-100 rounded px-2 py-0.5",
          "cursor-pointer outline-none focus:bg-gray-100 focus:ring-1 focus:ring-gray-300",
        )}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        <span className={cn(isParent ? "font-medium" : "text-gray-700")}>
          {node.entry.filename.split("/").pop()}
        </span>
        <span className="flex items-center gap-1">
          {statusIcon}
          {icon}
        </span>
      </div>

      {children}
    </div>
  );
};
