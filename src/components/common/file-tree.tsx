import { A } from "@solidjs/router";
import { Component, createMemo, For, Match, Switch } from "solid-js";
import { File } from "~/types";

export const FileTree: Component<{ files: File[] }> = (props) => {
  const tree = createMemo(() => createTree(props.files));

  return <For each={tree()}>{(node) => <FileNode node={node} />}</For>;
};

const FileNode: Component<{ node: TreeNode }> = (props) => {
  return (
    <li class="ml-4 list-none">
      <Switch fallback={<p class="font-bold">{props.node.name}</p>}>
        <Match when={props.node.file}>
          <A href={`TODO`}>{props.node.name}</A>
        </Match>
      </Switch>

      <ul>
        <For each={props.node.children}>
          {(child) => <FileNode node={child} />}
        </For>
      </ul>
    </li>
  );
};

interface TreeNode {
  name: string;
  file?: File;
  children: TreeNode[];
}

const createTree = (files: File[]): TreeNode[] => {
  const tree: TreeNode[] = [];

  for (const file of files) {
    const parts = file.filename.split("/");
    let node = tree.find((node) => node.name === parts[0]);

    if (node === undefined) {
      node = { name: parts[0], children: [] };
      tree.push(node);
    }

    for (let i = 1; i < parts.length; i++) {
      let child: TreeNode | undefined = node.children.find(
        (child) => child.name === parts[i],
      );

      if (child === undefined) {
        child = { name: parts[i], children: [] };
        node.children.push(child);
      }

      node = child;
    }

    node.file = file;
  }

  return tree;
};
