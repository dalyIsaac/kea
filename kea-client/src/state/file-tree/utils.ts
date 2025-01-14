import { DiffEntry } from "~/api/types";
import { FileEntryNode } from "./types";

export const toTree = (data: DiffEntry[]): FileEntryNode[] => {
  const roots: FileEntryNode[] = [];

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

      const createdChild: FileEntryNode =
        idx === path.length
          ? { entry }
          : { entry: { filename: prefix }, children: [], isExpanded: false };

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

export const getPathNodes = (path: string, tree: FileEntryNode[]): FileEntryNode[] => {
  const nodes: FileEntryNode[] = [];
  const pathParts = path.split("/");

  let parents = tree;
  for (const part of pathParts) {
    const child = parents.find((node) => node.entry.filename === part);
    if (!child) {
      return [];
    }

    nodes.push(child);

    if ("children" in child) {
      parents = child.children;
    } else {
      break;
    }
  }

  return nodes;
};
