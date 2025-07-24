import * as vscode from "vscode";
import { IKeaContext } from "../../core/context";
import { IRepository } from "../../repository/repository";
import { CommitFile, FileComment } from "../../types/kea";
import { IParentTreeNode } from "../tree-node";
import { BaseFileTreeNode } from "./base-file-tree-node";
import { BaseFolderTreeNode } from "./base-folder-tree-node";

export type FilesRootTreeNodeChild = BaseFileTreeNode | BaseFolderTreeNode<FilesRootTreeNodeChild>;

export abstract class BaseFilesRootTreeNode implements IParentTreeNode<FilesRootTreeNodeChild> {
  protected _ctx: IKeaContext;
  protected _repository: IRepository;

  protected constructor(ctx: IKeaContext, repository: IRepository) {
    this._ctx = ctx;
    this._repository = repository;
  }

  abstract getTreeItem(): vscode.TreeItem;

  abstract getChildren(): Promise<FilesRootTreeNodeChild[]>;

  protected abstract createFileNode(file: CommitFile, comments: FileComment[]): BaseFileTreeNode;

  protected abstract createFolderNode(folderPath: string): BaseFolderTreeNode<FilesRootTreeNodeChild>;

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

      let folderNode = parents.find((node) => node instanceof BaseFolderTreeNode && node.folderName === folderName) as
        | BaseFolderTreeNode<FilesRootTreeNodeChild>
        | undefined;
      if (folderNode === undefined) {
        folderNode = this.createFolderNode(folderPath);
        parents.push(folderNode);
      }

      parents = folderNode.children;
    }

    const comments = reviewComments.filter((comment) => comment.path === file.filename);
    const fileName = pathParts[pathParts.length - 1];
    const fileNode = this.createFileNode(file, comments);

    if (!parents.some((node) => node instanceof BaseFileTreeNode && node.fileName === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}
