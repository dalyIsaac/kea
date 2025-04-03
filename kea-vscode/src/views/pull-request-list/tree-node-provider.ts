import * as vscode from "vscode";
import { IParentTreeNode, isParentTreeNode, ITreeNode } from "../tree-node";

export interface ITreeNodeProvider<T extends ITreeNode | IParentTreeNode<T>> extends vscode.TreeDataProvider<T> {
  onDidChangeTreeData: vscode.Event<T | undefined | void>;
  refresh: () => void;
}

export abstract class TreeNodeProvider<T extends ITreeNode | IParentTreeNode<T>> implements ITreeNodeProvider<T> {
  protected _onDidChangeTreeData: vscode.EventEmitter<T | undefined | void> = new vscode.EventEmitter<T | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<T | undefined | void> = this._onDidChangeTreeData.event;

  getTreeItem = (element: T): vscode.TreeItem | Thenable<vscode.TreeItem> => element.getTreeItem();

  getChildren = (element?: T): T[] | Thenable<T[]> => {
    if (element === undefined) {
      return this._getRootChildren();
    }

    if (isParentTreeNode(element)) {
      return element.getChildren() as T[] | Thenable<T[]>;
    }

    return [];
  };

  protected abstract _getRootChildren(): Promise<T[]>;

  refresh = (): void => {
    this._onDidChangeTreeData.fire();
  };
}
