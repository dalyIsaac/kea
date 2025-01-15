import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { cn } from "~/lib/utils";
import { createSelectFileTreeNode } from "~/state/file-tree/selectors";
import { fileTreeSlice } from "~/state/file-tree/slice";
import { ParentEntryNode } from "~/state/file-tree/types";
import { isParentNode } from "~/state/file-tree/utils";
import { useKeaSelector } from "~/state/store";
import { BaseProps, DiffTreeBaseNode } from "./diff-tree-base-node";
import { DiffTreeLeafNode } from "./diff-tree-leaf-node";

interface DiffTreeParentNodeProps extends BaseProps {
  node: ParentEntryNode;
}

export const DiffTreeParentNode: React.FC<DiffTreeParentNodeProps> = ({ node, tabIndex }) => {
  const selectFileTreeNode = useMemo(
    () => createSelectFileTreeNode(node.entry.filename),
    [node.entry.filename],
  );
  const entryNode = useKeaSelector(selectFileTreeNode) as ParentEntryNode;
  const dispatch = useDispatch();

  const isExpanded = entryNode.isExpanded;
  const icon = isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />;

  const setIsExpanded = (expanded: boolean) => {
    dispatch(
      fileTreeSlice.actions.setIsExpanded({
        path: node.entry.filename,
        isExpanded: expanded,
      }),
    );
  };

  const toggleExpand = () => {
    dispatch(fileTreeSlice.actions.toggleExpand(node.entry.filename));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpand();
      return;
    }

    if (event.key === "ArrowRight" && !isExpanded) {
      event.preventDefault();
      setIsExpanded(true);
      return;
    }

    if (event.key === "ArrowLeft" && isExpanded) {
      event.preventDefault();
      setIsExpanded(false);
    }
  };

  return (
    <DiffTreeBaseNode
      node={node}
      icon={icon}
      ariaExpanded={isExpanded}
      onClick={toggleExpand}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
    >
      <div
        role="group"
        aria-hidden={!isExpanded}
        className={cn(
          "ml-3.5 overflow-hidden border-l border-gray-200 pl-1 transition-all duration-200",
          isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {node.children.map((child) =>
          isParentNode(child) ? (
            <DiffTreeParentNode key={child.entry.filename} node={child} tabIndex={0} />
          ) : (
            <DiffTreeLeafNode key={child.entry.filename} node={child} tabIndex={0} />
          ),
        )}
      </div>
    </DiffTreeBaseNode>
  );
};
