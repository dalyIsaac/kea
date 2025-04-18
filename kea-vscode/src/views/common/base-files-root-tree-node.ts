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

  #fileToTree = (roots: FilesRootTreeNodeChild[], file: CommitFile, reviewComments: FileComment[]): FilesRootTreeNodeChild[] => {
    let parents = roots;
    const pathParts = file.filename.split("/");

    for (let idx = 0; idx < pathParts.length - 1; idx += 1) {
      const folderName = pathParts[idx];
      const folderPath = pathParts.slice(0, idx + 1).join("/");

      let folderNode = parents.find((node) => node instanceof FolderTreeNode && node.folderName === folderName);
      if (folderNode === undefined) {
        folderNode = new FolderTreeNode(folderPath);
        parents.push(folderNode);
      }

      parents = (folderNode as FolderTreeNode).children;
    }

    const comments = reviewComments.filter((comment) => comment.path === file.filename);
    const fileName = pathParts[pathParts.length - 1];
    const fileNode = new FileTreeNode(this._repository.account.accountKey, this._repository.repoId, file, comments);

    if (!parents.some((node) => node instanceof FileTreeNode && node.fileName === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}
