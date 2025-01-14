import { DiffEntry } from "~/api/types";

export interface ParentNode {
  entry: { filename: string };
  children: FileEntryNode[];
  isExpanded: boolean;
}

export interface LeafNode {
  entry: DiffEntry;
}

export type FileEntryNode = ParentNode | LeafNode;

export interface FileTreeState {
  tree: FileEntryNode[];
  selectedPath: string;
}
