import { ChevronDown, ChevronRight } from "lucide-react";
import { FC, ReactNode, useState } from "react";
import { DiffEntry } from "~/api/types";
import { cn } from "~/lib/utils";

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    inert?: "" | undefined;
  }
}

interface Node {
  entry: DiffEntry | { filename: string };
  children: Node[];
}

interface DiffEntryNodeProps {
  node: Node;
  tabIndex?: number;
}

export const DiffEntryNode: FC<DiffEntryNodeProps> = ({ node, tabIndex = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isLeaf = !hasChildren;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === "Enter" || event.key === " ") && hasChildren) {
      event.preventDefault();
      toggleExpand();
    } else if (event.key === "ArrowRight" && hasChildren && !isExpanded) {
      event.preventDefault();
      setIsExpanded(true);
    } else if (event.key === "ArrowLeft" && hasChildren && isExpanded) {
      event.preventDefault();
      setIsExpanded(false);
    }
  };

  let icon: ReactNode = null;
  if (hasChildren) {
    icon = isExpanded ? (
      <ChevronDown size={14} className="relative -top-px" />
    ) : (
      <ChevronRight size={14} className="relative -top-px" />
    );
  }

  return (
    <div className="select-none text-sm my-0.5">
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={tabIndex}
        className={cn(
          "flex items-center gap-1 hover:bg-gray-100 rounded px-2 py-0.5",
          "cursor-pointer outline-none focus:bg-gray-100 focus:ring-1 focus:ring-gray-300",
        )}
        onClick={toggleExpand}
        onKeyDown={handleKeyDown}
      >
        <span className="text-gray-500 w-3.5 h-3.5">{icon}</span>
        <span className={cn(isLeaf ? "text-gray-700" : "font-medium")}>
          {node.entry.filename.split("/").pop()}
        </span>
      </div>

      {hasChildren && (
        <div
          role="group"
          inert={!isExpanded ? "" : undefined}
          className={cn(
            "ml-3.5 pl-1 border-l border-gray-200 overflow-hidden transition-all duration-200",
            isExpanded ? "opacity-100 max-h-[1000px]" : "opacity-0 max-h-0",
          )}
        >
          {node.children.map((child) => (
            <DiffEntryNode key={child.entry.filename} node={child} tabIndex={0} />
          ))}
        </div>
      )}
    </div>
  );
};
