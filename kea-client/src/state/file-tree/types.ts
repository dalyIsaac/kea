import { DiffEntry } from "~/api/types";

export interface ParentEntryNode {
  filename: string;
  children: EntryNode[];
  isExpanded: boolean;
}

export interface LeafEntryNode {
  filename: string;
  entry: DiffEntry;
}

export type EntryNode = ParentEntryNode | LeafEntryNode;

export interface FileTreeState {
  tree: EntryNode[];
  selectedFileSha: string | null;
  selectedLeftLine: number | null;
  selectedRightLine: number | null;
}
