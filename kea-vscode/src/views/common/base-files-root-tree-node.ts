import * as vscode from "vscode";
import { IKeaRepository } from "../../repository/kea-repository";
import { CommitFile, FileComment } from "../../types/kea";
import { IParentTreeNode } from "../tree-node";
import { FileTreeNode } from "./file-tree-node";
import { FolderTreeNode } from "./folder-tree-node";

export type FilesRootTreeNodeChild = FileTreeNode | FolderTreeNode;

export abstract class BaseFilesRootTreeNode implements IParentTreeNode<FilesRootTreeNodeChild> {
  protected _repository: IKeaRepository;

  protected constructor(repository: IKeaRepository) {
    this._repository = repository;
  }

  abstract getTreeItem(): vscode.TreeItem;

  abstract getChildren(): Promise<FilesRootTreeNodeChild[]>;

  protected _toTree = (files: CommitFile[], reviewComments: FileComment[]): FilesRootTreeNodeChild[] => {
    const sortedFiles = files.sort((a, b) => a.filename.localeCompare(b.filename));
    let roots: FilesRootTreeNodeChild[] = [];

    for (const entry of sortedFiles) {
      roots = this.#fileToTree(roots, entry, reviewComments);
    }

    return roots;
  };

  /**
   * Adds a file to the tree structure.
   * @param roots All the root nodes of the tree - i.e., the folders and files at the top level.
   * @param fileToAdd The file to be added to the tree.
   * @param reviewComments All the review comments, including those for other files.
   * @returns The updated tree with the new file added.
   */
  #fileToTree = (roots: FilesRootTreeNodeChild[], fileToAdd: CommitFile, reviewComments: FileComment[]): FilesRootTreeNodeChild[] => {
    const pathParts = fileToAdd.filename.split("/");
    const childrenOfParent = this.#getChildrenOfParent(roots, pathParts);

    const comments = reviewComments.filter((comment) => comment.path === fileToAdd.filename);
    const fileName = pathParts[pathParts.length - 1];

    const fileNode = new FileTreeNode(this._repository.account.accountKey, this._repository.repoId, fileToAdd, comments);

    if (!childrenOfParent.some((node) => node instanceof FileTreeNode && node.fileName === fileName)) {
      childrenOfParent.push(fileNode);
    }

    return roots;
  };

  /**
   * Gets the children of the parent node of the file to add in the tree structure.
   * @param roots All the root nodes of the tree - i.e., the folders and files at the top level.
   * @param pathParts The parts of the path of the file to add.
   * @returns The children of the parent node of the file to add.
   */
  #getChildrenOfParent = (roots: FilesRootTreeNodeChild[], pathParts: string[]): FilesRootTreeNodeChild[] => {
    let childrenOfParent = roots;

    for (let idx = 0; idx < pathParts.length - 1; idx += 1) {
      const folderName = pathParts[idx];
      const folderPath = pathParts.slice(0, idx + 1).join("/");

      let folderNode = childrenOfParent.find((node) => node instanceof FolderTreeNode && node.folderName === folderName);
      if (folderNode === undefined) {
        folderNode = new FolderTreeNode(folderPath);
        childrenOfParent.push(folderNode);
      }

      childrenOfParent = (folderNode as FolderTreeNode).children;
    }

    return childrenOfParent;
  };
}
