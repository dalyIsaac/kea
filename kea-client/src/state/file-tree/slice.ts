import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DiffEntry } from "~/api/types";
import { FileTreeState } from "~/state/file-tree/types";
import { getPathNodes, toTree } from "./utils";

export const initialFileTreeState: FileTreeState = {
  tree: [],
  selectedPath: "",
};

export const fileTreeSlice = createSlice({
  name: "fileTree",
  initialState: initialFileTreeState,
  reducers: {
    setTree: (state, action: PayloadAction<DiffEntry[]>) => {
      state.tree = toTree(action.payload);
    },

    expandNode: (state, action: PayloadAction<string>) => {
      const pathNodes = getPathNodes(action.payload, state.tree);

      for (const node of pathNodes) {
        if ("children" in node) {
          node.isExpanded = true;
        }
      }
    },

    collapseNode: (state, action: PayloadAction<string>) => {
      const pathNodes = getPathNodes(action.payload, state.tree);
      const nodeAtPath = pathNodes.at(-1);

      if (nodeAtPath && "children" in nodeAtPath) {
        nodeAtPath.isExpanded = false;
      }
    },

    setSelectedPath: (state, action: PayloadAction<string>) => {
      state.selectedPath = action.payload;
    },
  },
});
