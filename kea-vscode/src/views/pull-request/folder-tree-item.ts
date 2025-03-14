import * as vscode from "vscode";
import { ParentTreeItem } from "../parent-tree-item";
import { FileTreeItem } from "./file-tree-item";

/**
 * Tree item representing a folder.
 */
export class FolderTreeItem extends ParentTreeItem<FileTreeItem> {
  // Overrides.
  contextValue = "folder";
  iconPath = new vscode.ThemeIcon("folder");
  tooltip = "Folder";

  // Properties.
  #folderPath: string;

  constructor(folderPath: string) {
    super(folderPath, vscode.TreeItemCollapsibleState.Collapsed);
    this.#folderPath = folderPath;
  }

  getChildren = async (): Promise<FileTreeItem[]> => {
    // TODO: get files in this folder.
    return [];
  };
}
