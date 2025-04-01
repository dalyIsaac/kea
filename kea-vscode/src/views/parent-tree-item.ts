import * as vscode from "vscode";

/**
 * @deprecated Use `ParentTreeNode` instead.
 */
export abstract class ParentTreeItem<T> extends vscode.TreeItem {
  abstract getChildren(): Promise<T[]> | T[];
}
