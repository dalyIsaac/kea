import { DiffEntry } from "~/api/types";
import { EntryNode, ParentEntryNode } from "./types";

export const toTree = (data: DiffEntry[]): EntryNode[] => {
  const roots: EntryNode[] = [];

  for (const entry of data) {
    let parents = roots;
    const path = entry.filename.split("/");

    for (let idx = 1; idx <= path.length; idx += 1) {
      const prefix = path.slice(0, idx).join("/");
      const prefixNode = parents.find((node) => node.entry.filename === prefix);

      if (prefixNode && "children" in prefixNode) {
        parents = prefixNode.children;
        continue;
      }

      const createdChild: EntryNode =
        idx === path.length
          ? { entry }
          : { entry: { filename: prefix }, children: [], isExpanded: true };

      parents.push(createdChild);

      if ("children" in createdChild) {
        parents = createdChild.children;
      } else {
        break;
      }
    }
  }

  return roots;
};

/**
 * Returns the node at the given path, regardless of whether it is a leaf or parent node. Returns null if the node does not exist.
 * @param path The path to the node.
 * @param tree The tree to search in.
 * @returns The node at the given path, or null if it does not exist.
 */
export const getNode = (path: string, tree: EntryNode[]): EntryNode | null => {
  let parentNode: ParentEntryNode | null = null;
  const parts = path.split("/");

  for (let idx = 0; idx < parts.length; idx += 1) {
    const part = parts.slice(0, idx + 1).join("/");
    let node: EntryNode | undefined;

    if (parentNode) {
      node = parentNode.children.find((child) => child.entry.filename === part);
    } else {
      node = tree.find((child) => child.entry.filename === part);
    }

    if (!node) {
      return null;
    }

    if ("children" in node) {
      parentNode = node;
    } else {
      return node;
    }
  }

  return parentNode;
};

export const isParentNode = (node: EntryNode): node is ParentEntryNode => {
  return "children" in node;
};
