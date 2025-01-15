import { LeafEntryNode } from "~/state/file-tree/types";
import { BaseProps, DiffTreeBaseNode } from "./diff-tree-base-node";

interface DiffTreeLeafNodeProps extends BaseProps {
  node: LeafEntryNode;
}

function getIconByStatus(status: string | undefined): React.ReactNode {
  switch (status) {
    case "Added":
      return <span className="text-green-500 font-semibold">A</span>;
    case "Removed":
      return <span className="text-red-500 font-semibold">R</span>;
    case "Modified":
    case "Changed":
      return <span className="text-blue-500 font-semibold">M</span>;
    case "Renamed":
      return <span className="text-yellow-500 font-semibold">N</span>;
    case "Copied":
      return <span className="text-purple-500 font-semibold">C</span>;
    case "Unchanged":
      return <span className="text-gray-400 font-semibold">U</span>;
    default:
      return null;
  }
}

export const DiffTreeLeafNode: React.FC<DiffTreeLeafNodeProps> = ({ node, ...rest }) => {
  const statusIcon = getIconByStatus(node.entry.status);
  return <DiffTreeBaseNode node={node} icon={statusIcon} {...rest} />;
};
