import * as vscode from "vscode";
import { IAccount } from "../../account/account";
import { PullRequestId } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { FileTreeItem } from "./file-tree-item";
import { FolderTreeItem } from "./folder-tree-item";

type FilesRootTreeItemChild = FileTreeItem | FolderTreeItem;

/**
 * Parent tree item for files.
 */
export class FilesRootTreeItem extends ParentTreeItem<FilesRootTreeItemChild> {
  // Overrides.
  contextValue = "file";
  iconPath = new vscode.ThemeIcon("file-directory");
  tooltip = "Files";

  // Properties.
  #account: IAccount;
  #pullId: PullRequestId;

  constructor(account: IAccount, id: PullRequestId) {
    super("Files", vscode.TreeItemCollapsibleState.Collapsed);
    this.#account = account;
    this.#pullId = id;
  }

  getChildren = async (): Promise<FilesRootTreeItemChild[]> => {
    const files = await this.#account.getPullRequestFiles(this.#pullId);
    if (files instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request files: ${files.message}`);
      return [];
    }

    return files.map((file) => new FileTreeItem(file));
  };
}
