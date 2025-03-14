import * as vscode from "vscode";
import { ParentTreeItem } from "../parent-tree-item";
import { FileTreeItem } from "./file-tree-item";

/**
 * Tree item representing a folder.
 */
export class FolderTreeItem extends ParentTreeItem<FileTreeItem | FolderTreeItem> {
  // Overrides.
  contextValue = "folder";
  iconPath = new vscode.ThemeIcon("folder");
  tooltip = "Folder";

  // Properties.
  #folderPath: string;
  children: Array<FileTreeItem | FolderTreeItem>;

  constructor(folderPath: string) {
    super(folderPath, vscode.TreeItemCollapsibleState.Collapsed);
    this.#folderPath = folderPath;
    this.children = [];
  }

  getChildren = async (): Promise<Array<FileTreeItem | FolderTreeItem>> => this.children;
}
