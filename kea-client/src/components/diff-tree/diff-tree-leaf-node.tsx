import { cn } from "~/lib/utils";
import { LeafEntryNode } from "~/state/file-tree/types";
import { BaseProps, DiffTreeBaseNode } from "./diff-tree-base-node";

interface DiffTreeLeafNodeProps extends BaseProps {
  node: LeafEntryNode;
}

const statusStyles = "font-mono font-semibold";

function getIconByStatus(status: string | undefined): React.ReactNode {
  switch (status) {
    case "Added":
      return <span className={cn(statusStyles, "text-green-500")}>A</span>;
    case "Removed":
      return <span className={cn(statusStyles, "text-red-500")}>R</span>;
    case "Modified":
    case "Changed":
      return <span className={cn(statusStyles, "text-blue-500")}>M</span>;
    case "Renamed":
      return <span className={cn(statusStyles, "text-yellow-500")}>N</span>;
    case "Copied":
      return <span className={cn(statusStyles, "text-purple-500")}>C</span>;
    case "Unchanged":
      return <span className={cn(statusStyles, "text-gray-400")}>U</span>;
    default:
      return null;
  }
}

export const DiffTreeLeafNode: React.FC<DiffTreeLeafNodeProps> = ({ node, ...rest }) => {
  const statusIcon = getIconByStatus(node.entry.status);
  return <DiffTreeBaseNode node={node} rightIcon={statusIcon} {...rest} />;
};
