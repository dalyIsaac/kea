import * as vscode from "vscode";
import { IAccount } from "../../account/account";
import { PullRequestComment, PullRequestFile, PullRequestId } from "../../types/kea";
import { ParentTreeItem } from "../parent-tree-item";
import { FileTreeItem } from "./file-tree-item";
import { FolderTreeItem } from "./folder-tree-item";

type FilesRootTreeItemChild = FileTreeItem | FolderTreeItem;

/**
 * Parent tree item for files.
 */
export class FilesRootTreeItem extends ParentTreeItem<FilesRootTreeItemChild> {
  override contextValue = "file";
  override iconPath = new vscode.ThemeIcon("file-directory");
  override tooltip = "Files";

  #account: IAccount;
  #pullId: PullRequestId;

  constructor(account: IAccount, id: PullRequestId) {
    super("Files", vscode.TreeItemCollapsibleState.Collapsed);
    this.#account = account;
    this.#pullId = id;
  }

  getChildren = async (): Promise<FilesRootTreeItemChild[]> => {
    const [files, reviewComments] = await Promise.all([
      this.#account.getPullRequestFiles(this.#pullId),
      this.#account.getPullRequestReviewComments(this.#pullId),
    ]);

    if (files instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request files: ${files.message}`);
      return [];
    }

    if (reviewComments instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request review comments: ${reviewComments.message}`);
      return FilesRootTreeItem.#toTree(files, []);
    }

    return FilesRootTreeItem.#toTree(files, reviewComments);
  };

  static #toTree = (files: PullRequestFile[], reviewComments: PullRequestComment[]): FilesRootTreeItemChild[] => {
    const sortedFiles = files.sort((a, b) => a.filename.localeCompare(b.filename));
    let roots: FilesRootTreeItemChild[] = [];

    for (const entry of sortedFiles) {
      roots = FilesRootTreeItem.#fileToTree(roots, entry, reviewComments);
    }

    return roots;
  };

  static #fileToTree = (
    roots: FilesRootTreeItemChild[],
    file: PullRequestFile,
    reviewComments: PullRequestComment[],
  ): FilesRootTreeItemChild[] => {
    let parents = roots;
    const pathParts = file.filename.split("/");

    for (let idx = 0; idx < pathParts.length - 1; idx += 1) {
      const folderName = pathParts[idx];
      const folderPath = pathParts.slice(0, idx + 1).join("/");

      let folderNode = parents.find((node) => node instanceof FolderTreeItem && node.label === folderName);
      if (folderNode === undefined) {
        folderNode = new FolderTreeItem(folderPath);
        parents.push(folderNode);
      }

      parents = (folderNode as FolderTreeItem).children;
    }

    const comments = reviewComments.filter((comment) => comment.path === file.filename);
    const fileName = pathParts[pathParts.length - 1];
    const fileNode = new FileTreeItem(comments, file);

    if (!parents.some((node) => node instanceof FileTreeItem && node.label === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}
