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

  let currentNodes = tree;

  for (const file of files) {
    const path = file.filename.split("/");
    const fileName = path.pop() as string;

    for (const dir of path) {
      let node = currentNodes.find((node) => node.name === dir);

      if (node === undefined) {
        node = { name: dir, children: [], file: undefined };
        currentNodes.push(node);
      }

      currentNodes = node.children;
    }

    currentNodes.push({ name: fileName, file, children: [] });
    currentNodes = tree;
  }

  return tree;
};
