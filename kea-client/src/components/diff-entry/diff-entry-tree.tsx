import { FC, useMemo } from "react";
import { DiffEntry } from "~/api/types";
import { Sidebar, SidebarHeader, SidebarTitle } from "~/components/sidebar";
import { DiffEntryNode } from "./diff-entry-node";

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    inert?: "" | undefined;
  }
}

interface Node {
  entry: DiffEntry | { filename: string };
  children: Node[];
}

const toTree = (data: DiffEntry[]) => {
  const roots: Node[] = [];

  for (const entry of data) {
    let parents = roots;
    const path = entry.filename.split("/");

    for (let idx = 1; idx <= path.length; idx += 1) {
      const prefix = path.slice(0, idx).join("/");
      const child = parents.find((node) => node.entry.filename === prefix);

      if (child) {
        parents = child.children;
        continue;
      }

      const createdChild =
        idx === path.length
          ? { entry, children: [] }
          : { entry: { filename: prefix }, children: [] };

      parents.push(createdChild);
      parents = createdChild.children;
    }
  }

  return roots;
};

export const DiffEntryTree: FC<{ data: DiffEntry[] }> = ({ data }) => {
  const tree = useMemo(() => toTree(data), [data]);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarTitle>Changes</SidebarTitle>
      </SidebarHeader>

      <div role="tree" className="px-1 py-0.5">
        {tree.map((node) => (
          <DiffEntryNode key={node.entry.filename} node={node} />
        ))}
      </div>
    </Sidebar>
  );
};
