import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EntryNode, FileTreeState } from "./types";
import { getNode, isParentNode } from "./utils";

export const initialFileTreeState: FileTreeState = {
  tree: [],
  selectedPath: null,
};

export const fileTreeSlice = createSlice({
  name: "fileTree",
  initialState: initialFileTreeState,
  reducers: {
    setTree: (state, action: PayloadAction<EntryNode[]>) => {
      state.tree = action.payload;
      state.selectedPath = null;
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

    setSelectedPath: (state, action: PayloadAction<string>) => {
      state.selectedPath = action.payload;
    },
  },
});
