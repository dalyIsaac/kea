import * as vscode from "vscode";
import { KeaDisposable } from "../core/kea-disposable";
import { IParentTreeNode, ITreeNode } from "./tree-node";
import { TreeNodeProvider } from "./tree-node-provider";

type NodeType<T> = T extends TreeNodeProvider<infer N> ? N : never;

/**
 * Container for a tree view and its provider.
 * @template T The TreeNodeProvider type.
 * @template N The node type, inferred from T by default.
 */
export interface ITreeViewContainer<T extends TreeNodeProvider<N>, N extends ITreeNode | IParentTreeNode<N> = NodeType<T>> {
  treeView: vscode.TreeView<N>;
  treeViewProvider: T;
}

/**
 * Implementation of ITreeViewContainer.
 */
export class TreeViewContainer<T extends TreeNodeProvider<N>, N extends ITreeNode | IParentTreeNode<N> = NodeType<T>>
  extends KeaDisposable
  implements ITreeViewContainer<T, N>
{
  treeView: vscode.TreeView<N>;
  treeViewProvider: T;

  constructor(treeViewId: string, treeViewProvider: T) {
    super();
    this.treeViewProvider = treeViewProvider;
    this.treeView = vscode.window.createTreeView(treeViewId, {
      treeDataProvider: this.treeViewProvider,
      showCollapseAll: true,
    });
    this._registerDisposable(this.treeView);
  }
}
