import * as vscode from "vscode";
import { IKeaRepository } from "../../repository/kea-repository";
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

  #repository: IKeaRepository;
  #pullId: PullRequestId;

  constructor(repository: IKeaRepository, id: PullRequestId) {
    super("Files", vscode.TreeItemCollapsibleState.Collapsed);
    this.#repository = repository;
    this.#pullId = id;
  }

  getChildren = async (): Promise<FilesRootTreeItemChild[]> => {
    const [files, reviewComments] = await Promise.all([
      this.#repository.getPullRequestFiles(this.#pullId),
      this.#repository.getPullRequestReviewComments(this.#pullId),
    ]);

    if (files instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request files: ${files.message}`);
      return [];
    }

    if (reviewComments instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching pull request review comments: ${reviewComments.message}`);
      return this.#toTree(files, []);
    }

    return this.#toTree(files, reviewComments);
  };

  #toTree = (files: PullRequestFile[], reviewComments: PullRequestComment[]): FilesRootTreeItemChild[] => {
    const sortedFiles = files.sort((a, b) => a.filename.localeCompare(b.filename));
    let roots: FilesRootTreeItemChild[] = [];

    for (const entry of sortedFiles) {
      roots = this.#fileToTree(roots, entry, reviewComments);
    }

    return roots;
  };

  #fileToTree = (
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
    const fileNode = new FileTreeItem(this.#repository.authSessionAccountId, this.#pullId, file, comments);

    if (!parents.some((node) => node instanceof FileTreeItem && node.label === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}
