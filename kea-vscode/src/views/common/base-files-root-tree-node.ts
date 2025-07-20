import * as vscode from "vscode";
import { IKeaRepository } from "../../repository/kea-repository";
import { CommitFile, FileComment } from "../../types/kea";
import { IParentTreeNode, ITreeNode } from "../tree-node";
import { BaseFileTreeNode } from "./base-file-tree-node";
import { BaseFolderTreeNode } from "./base-folder-tree-node";
import { RemoteFileTreeNode } from "./remote-commit/remote-file-tree-node";
import { RemoteFolderTreeNode } from "./remote-commit/remote-folder-tree-node";

export type FilesRootTreeNodeChild = BaseFileTreeNode | BaseFolderTreeNode<ITreeNode>;

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

      let folderNode = parents.find((node) => node instanceof RemoteFolderTreeNode && node.folderName === folderName);
      if (folderNode === undefined) {
        folderNode = new RemoteFolderTreeNode(folderPath);
        parents.push(folderNode);
      }

      parents = (folderNode as RemoteFolderTreeNode).children;
    }

    const comments = reviewComments.filter((comment) => comment.path === file.filename);
    const fileName = pathParts[pathParts.length - 1];
    const fileNode = new RemoteFileTreeNode(this._repository.account.accountKey, this._repository.repoId, file, comments);

    if (!parents.some((node) => node instanceof RemoteFileTreeNode && node.fileName === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}
