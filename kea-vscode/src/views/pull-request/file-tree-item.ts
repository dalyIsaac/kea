import * as vscode from "vscode";
import { PullRequestFile } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { CommentTreeItem } from "./comment-tree-item";

/**
 * Tree item representing a file.
 */
export class FileTreeItem extends ParentTreeItem<CommentTreeItem> {
  // Overrides.
  contextValue = "file";
  iconPath = new vscode.ThemeIcon("file");
  tooltip = "File";

  // Properties.
  #file: PullRequestFile;

  constructor(file: PullRequestFile) {
    const name = file.filename.split("/").pop() ?? file.filename;
    // TODO: Only have a collapsed state if the file has comments.
    super(name, vscode.TreeItemCollapsibleState.Collapsed);
    this.#file = file;
  }

  getChildren = async (): Promise<CommentTreeItem[]> => {
    // TODO: get comments for this file.
    return [];
  };
}
