import { Link, LinkProps } from "@tanstack/react-router";
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
  isSelected?: boolean;
  to?: LinkProps["to"];
  search?: LinkProps["search"];
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
  isSelected,
  to,
  search,
}: DiffTreeBaseNodeProps<T>): React.ReactElement => {
  const contentElement = (
    <>
      <span className="flex w-4 flex-shrink-0 items-center justify-center">{leftIcon}</span>
      <span className="flex-1 truncate text-left text-gray-700">
        {node.entry.filename.split("/").pop()}
      </span>
      <span className="ml-auto flex w-4 flex-shrink-0 items-center justify-center">
        {rightIcon}
      </span>
    </>
  );

  const className = cn(
    "my-0.5 ml-0.5 flex items-center gap-1 rounded px-1 py-0.5 hover:bg-gray-100",
    "cursor-pointer outline-none focus:bg-gray-100 focus:ring-1 focus:ring-gray-300",
    isSelected && "bg-gray-200",
  );

  const treeItemProps = {
    role: "treeitem",
    "aria-expanded": ariaExpanded,
    tabIndex,
    className,
    onClick,
    onKeyDown,
  };

  return (
    <div className="select-none text-center text-sm">
      {to ? (
        <Link to={to} search={search} {...treeItemProps}>
          {contentElement}
        </Link>
      ) : (
        <div {...treeItemProps}>{contentElement}</div>
      )}
      {children}
    </div>
  );
};
