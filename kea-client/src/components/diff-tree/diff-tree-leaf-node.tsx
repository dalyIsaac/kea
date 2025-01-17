import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { cn } from "~/lib/utils";
import { createIsNodeSelected } from "~/state/file-tree/selectors";
import { fileTreeSlice } from "~/state/file-tree/slice";
import { LeafEntryNode } from "~/state/file-tree/types";
import { useKeaSelector } from "~/state/store";
import { BaseProps, DiffTreeBaseNode } from "./diff-tree-base-node";

interface DiffTreeLeafNodeProps extends BaseProps {
  node: LeafEntryNode;
}

// Padding top to align with the filename text.
const statusStyles = "font-mono font-semibold pt-0.5";

function getIconByStatus(status: string | undefined): React.ReactNode {
  switch (status) {
    case "Added":
      return <span className={cn(statusStyles, "text-green-500")}>A</span>;
    case "Removed":
      return <span className={cn(statusStyles, "text-red-500")}>D</span>;
    case "Modified":
    case "Changed":
      return <span className={cn(statusStyles, "text-blue-500")}>M</span>;
    case "Renamed":
      return <span className={cn(statusStyles, "text-yellow-500")}>R</span>;
    case "Copied":
      return <span className={cn(statusStyles, "text-purple-500")}>C</span>;
    case "Unchanged":
      return <span className={cn(statusStyles, "text-gray-400")}>U</span>;
    default:
      return null;
  }
}

export const DiffTreeLeafNode: React.FC<DiffTreeLeafNodeProps> = ({ node, ...rest }) => {
  const dispatch = useDispatch();

  const selectIsNodeSelected = useMemo(
    () => createIsNodeSelected(node.entry.filename),
    [node.entry.filename],
  );
  const isSelected = useKeaSelector(selectIsNodeSelected);

  const statusIcon = getIconByStatus(node.entry.status);

  const onSelectNode = () => {
    dispatch(fileTreeSlice.actions.setSelectedPath(node.entry.filename));
  };

  return (
    <DiffTreeBaseNode
      node={node}
      rightIcon={statusIcon}
      {...rest}
      onClick={onSelectNode}
      isSelected={isSelected}
    />
  );
};
