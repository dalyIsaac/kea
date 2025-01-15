import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EntryNode, FileTreeState } from "./types";
import { getPathNodes } from "./utils";

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
      const pathNodes = getPathNodes(action.payload.path, state.tree);
      const nodeAtPath = pathNodes.at(-1);

      if (nodeAtPath && "children" in nodeAtPath) {
        nodeAtPath.isExpanded = action.payload.isExpanded;
      }
    },

    toggleExpand: (state, action: PayloadAction<string>) => {
      const pathNodes = getPathNodes(action.payload, state.tree);
      const nodeAtPath = pathNodes.at(-1);

      if (nodeAtPath && "children" in nodeAtPath) {
        nodeAtPath.isExpanded = !nodeAtPath.isExpanded;
      }
    },

    setSelectedPath: (state, action: PayloadAction<string>) => {
      state.selectedPath = action.payload;
    },
  },
});
