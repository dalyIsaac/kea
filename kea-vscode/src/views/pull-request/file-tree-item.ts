import * as vscode from "vscode";
import { PullRequestFile } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { CommentTreeItem } from "./comment-tree-item";

/**
 * Tree item representing a file.
 */
export class FileTreeItem extends ParentTreeItem<CommentTreeItem> {
  override contextValue = "file";
  override iconPath = new vscode.ThemeIcon("file");
  override tooltip = "File";

  constructor(file: PullRequestFile) {
    const name = file.filename.split("/").pop() ?? file.filename;
    // TODO: Only have a collapsed state if the file has comments.
    super(name, vscode.TreeItemCollapsibleState.Collapsed);
  }

  getChildren = (): CommentTreeItem[] => {
    // TODO: get comments for this file.
    return [];
  };
}
