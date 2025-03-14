import * as vscode from "vscode";
import { IAccount } from "../../account/account";
import { PullRequestFile, PullRequestId } from "../../types/kea";
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

    return FilesRootTreeItem.#toTree(files);
  };

  static #toTree = (files: PullRequestFile[]): FilesRootTreeItemChild[] => {
    const sortedFiles = files.sort((a, b) => a.filename.localeCompare(b.filename));
    let roots: FilesRootTreeItemChild[] = [];

    for (const entry of sortedFiles) {
      roots = FilesRootTreeItem.#fileToTree(roots, entry);
    }

    return roots;
  };

  static #fileToTree = (roots: FilesRootTreeItemChild[], file: PullRequestFile): FilesRootTreeItemChild[] => {
    let parents = roots;
    const pathParts = file.filename.split("/");

    // Traverse the path down to the file.
    // We start at 1 because the first part is the root folder.
    // We also need to create the parent folders as we go.
    for (let idx = 1; idx <= pathParts.length; idx += 1) {
      const currentPath = pathParts.slice(0, idx).join("/");
      let currentNode = parents.find((node) => node.label === currentPath);

      if (currentNode instanceof FolderTreeItem) {
        // Parent node already exists, so we just add the child to it.
        parents = currentNode.children;
        continue;
      }

      currentNode = idx === pathParts.length ? new FileTreeItem(file) : new FolderTreeItem(currentPath);

      parents.push(currentNode);

      if (currentNode instanceof FolderTreeItem) {
        parents = currentNode.children;
      } else {
        // If it's a file, we don't need to go deeper.
        // Add the file to the parent.

        break;
      }
    }

    return roots;
  };
}
