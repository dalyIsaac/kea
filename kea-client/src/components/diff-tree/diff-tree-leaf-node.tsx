import { LeafEntryNode } from "~/state/file-tree/types";
import { BaseProps, DiffTreeBaseNode } from "./diff-tree-base-node";

interface DiffTreeLeafNodeProps extends BaseProps {
  node: LeafEntryNode;
}

function getIconByStatus(status: string | undefined): React.ReactNode {
  switch (status) {
    case "Added":
      return <span className="font-semibold text-green-500">A</span>;
    case "Removed":
      return <span className="font-semibold text-red-500">R</span>;
    case "Modified":
    case "Changed":
      return <span className="font-semibold text-blue-500">M</span>;
    case "Renamed":
      return <span className="font-semibold text-yellow-500">N</span>;
    case "Copied":
      return <span className="font-semibold text-purple-500">C</span>;
    case "Unchanged":
      return <span className="font-semibold text-gray-400">U</span>;
    default:
      return null;
  }
}

export const DiffTreeLeafNode: React.FC<DiffTreeLeafNodeProps> = ({ node, ...rest }) => {
  const statusIcon = getIconByStatus(node.entry.status);
  return <DiffTreeBaseNode node={node} icon={statusIcon} {...rest} />;
};
