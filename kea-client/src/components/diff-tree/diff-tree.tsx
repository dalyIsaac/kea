import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { DiffEntry } from "~/api/types";
import { InlineLoaderIcon } from "~/components/icons/inline-loader-icon";
import { Sidebar, SidebarHeader, SidebarTitle } from "~/components/sidebar";
import { selectFileTreeLength } from "~/state/file-tree/selectors";
import { fileTreeSlice } from "~/state/file-tree/slice";
import { isParentNode, toTree } from "~/state/file-tree/utils";
import { useKeaSelector } from "~/state/store";
import { DiffTreeLeafNode } from "./diff-tree-leaf-node";
import { DiffTreeParentNode } from "./diff-tree-parent-node";

export const DiffTree: React.FC<{ data: DiffEntry[] | undefined }> = ({ data }) => {
  const dispatch = useDispatch();

  // Memoize the tree to avoid re-rendering in this component.
  const tree = useMemo(() => (data ? toTree(data) : null), [data]);

  useEffect(() => {
    if (tree === null) {
      return;
    }

    dispatch(fileTreeSlice.actions.setTree(tree));
  }, [tree, dispatch]);

  // Since the tree won't be present on the first render, only render the sidebar if there are nodes.
  const storeTreeLength = useKeaSelector(selectFileTreeLength);
  const canRenderNodes = storeTreeLength > 0 && tree !== null;

  return (
    <Sidebar className="flex h-full flex-col">
      <div className="sticky top-0 z-10 bg-white">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SidebarTitle>
              Changes
              {data === undefined && <InlineLoaderIcon className="ml-2" />}
            </SidebarTitle>
          </div>
        </SidebarHeader>
      </div>

      {canRenderNodes ? (
        <div role="tree" className="h-0 flex-1 overflow-y-auto px-1 py-0.5">
          {tree.map((node) =>
            isParentNode(node) ? (
              <DiffTreeParentNode key={node.filename} node={node} tabIndex={0} />
            ) : (
              <DiffTreeLeafNode key={node.filename} node={node} tabIndex={0} />
            ),
          )}
        </div>
      ) : null}
    </Sidebar>
  );
};
