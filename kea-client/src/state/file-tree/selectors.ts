import { createSelector } from "@reduxjs/toolkit";
import { KeaRootState } from "~/state/store";
import { findNode, getNode, isParentNode } from "./utils";

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

export const createIsNodeSelected = (sha: string) =>
  createSelector(
    (state: KeaRootState) => state.fileTree.selectedFileSha,
    (selectedPath) => selectedPath === sha,
  );

export const createSelectIsChildSelected = (path: string) =>
  createSelector(
    (state: KeaRootState) => state.fileTree.selectedFileSha,
    (selectedPath) => selectedPath?.startsWith(path) ?? false,
  );

export const createSelectIsNodeCollapsedAndChildSelected = (path: string) =>
  createSelector(
    createSelectIsChildSelected(path),
    createSelectFileTreeNode(path),
    (isChildSelected, node) => !!node && isParentNode(node) && !node.isExpanded && isChildSelected,
  );
export const selectFileTreeLength = createSelector(
  (state: KeaRootState) => state.fileTree.tree,
  (tree) => tree.length,
);

export const selectSelectedNode = createSelector(
  (state: KeaRootState) => state.fileTree.tree,
  (state: KeaRootState) => state.fileTree.selectedFileSha,
  (tree, selectedSha) => {
    if (selectedSha === null) {
      return null;
    }

    const node = findNode((n) => !isParentNode(n) && n.entry.sha === selectedSha, tree);
    if (node !== null && !isParentNode(node)) {
      return node;
    }

    return null;
  },
);
