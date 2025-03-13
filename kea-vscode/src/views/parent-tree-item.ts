import * as vscode from "vscode";

export abstract class ParentTreeItem<T> extends vscode.TreeItem {
  abstract getChildren: () => Promise<T[]>;
}
