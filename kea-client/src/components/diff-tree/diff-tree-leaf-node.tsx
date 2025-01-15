import { LeafEntryNode } from "~/state/file-tree/types";
import { BaseProps, DiffTreeBaseNode } from "./diff-tree-base-node";

interface DiffTreeLeafNodeProps extends BaseProps {
  node: LeafEntryNode;
}

export const DiffTreeLeafNode: React.FC<DiffTreeLeafNodeProps> = (props) => {
  return <DiffTreeBaseNode {...props} />;
};
