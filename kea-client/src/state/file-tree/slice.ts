import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EntryNode, FileTreeState } from "./types";
import { getNode, isParentNode } from "./utils";

export const initialFileTreeState: FileTreeState = {
  tree: [],
  selectedFileSha: null,
  selectedLeftLine: null,
  selectedRightLine: null,
};

export const fileTreeSlice = createSlice({
  name: "fileTree",
  initialState: initialFileTreeState,
  reducers: {
    setTree: (state, action: PayloadAction<EntryNode[]>) => {
      state.tree = action.payload;
    },

    setIsExpanded: (state, action: PayloadAction<{ path: string; isExpanded: boolean }>) => {
      const node = getNode(action.payload.path, state.tree);

      if (node && isParentNode(node)) {
        node.isExpanded = action.payload.isExpanded;
      }
    },

    toggleExpand: (state, action: PayloadAction<string>) => {
      const node = getNode(action.payload, state.tree);

      if (node && isParentNode(node)) {
        node.isExpanded = !node.isExpanded;
      }
    },

    setSelectedPath: (
      state,
      action: PayloadAction<{ sha: string; leftLine?: number; rightLine?: number }>,
    ) => {
      state.selectedFileSha = action.payload.sha;
      state.selectedLeftLine = action.payload.leftLine ?? null;
      state.selectedRightLine = action.payload.rightLine ?? null;
    },
  },
});
