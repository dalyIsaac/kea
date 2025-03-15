import * as vscode from "vscode";
import { ParentTreeItem } from "../parent-tree-item";
import { FileTreeItem } from "./file-tree-item";

/**
 * Tree item representing a folder.
 */
export class FolderTreeItem extends ParentTreeItem<FileTreeItem | FolderTreeItem> {
  override contextValue = "folder";
  override iconPath = new vscode.ThemeIcon("folder");
  override tooltip = "Folder";

  children: Array<FileTreeItem | FolderTreeItem>;

  constructor(folderPath: string) {
    super(folderPath, vscode.TreeItemCollapsibleState.Collapsed);
    this.children = [];
  }

  getChildren = (): Array<FileTreeItem | FolderTreeItem> => this.children;
}
