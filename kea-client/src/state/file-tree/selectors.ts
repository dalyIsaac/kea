import { createSelector } from "@reduxjs/toolkit";
import { KeaRootState } from "~/state/store";
import { getNode } from "./utils";

export const createSelectFileTreeNode = (path: string) =>
  createSelector(
    (state: KeaRootState) => state.fileTree.tree,
    (tree) => {
      if (path === null) {
        return null;
      }

      const node = getNode(path, tree);

      if (node === null) {
        throw new Error(`Node at path ${path} not found`);
      }

      return node;
    },
  );

export const selectFileTreeLength = createSelector(
  (state: KeaRootState) => state.fileTree.tree,
  (tree) => tree.length,
);
