import * as vscode from "vscode";
import { IKeaRepository } from "../../repository/kea-repository";
import { PullRequestComment, PullRequestFile, PullRequestId } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { FileTreeNode } from "./file-tree-node";
import { FolderTreeNode } from "./folder-tree-node";

type FilesRootTreeNodeChild = FileTreeNode | FolderTreeNode;

/**
 * Parent tree item for files.
 */
export class FilesRootTreeNode implements IParentTreeNode<FilesRootTreeNodeChild> {
  #contextValue = "file";
  #iconPath = new vscode.ThemeIcon("file-directory");
  #tooltip = "Files";
  #label = "Files";

  collapsibleState: CollapsibleState = "collapsed";

  #repository: IKeaRepository;
  #pullId: PullRequestId;

  constructor(repository: IKeaRepository, id: PullRequestId) {
    this.#repository = repository;
    this.#pullId = id;
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.#label, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;
    return treeItem;
  };

  getChildren = async (): Promise<FilesRootTreeNodeChild[]> => {
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

  #toTree = (files: PullRequestFile[], reviewComments: PullRequestComment[]): FilesRootTreeNodeChild[] => {
    const sortedFiles = files.sort((a, b) => a.filename.localeCompare(b.filename));
    let roots: FilesRootTreeNodeChild[] = [];

    for (const entry of sortedFiles) {
      roots = this.#fileToTree(roots, entry, reviewComments);
    }

    return roots;
  };

  #fileToTree = (
    roots: FilesRootTreeNodeChild[],
    file: PullRequestFile,
    reviewComments: PullRequestComment[],
  ): FilesRootTreeNodeChild[] => {
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
    const fileNode = new FileTreeNode(this.#repository.account.accountKey, this.#pullId, file, comments);

    if (!parents.some((node) => node instanceof FileTreeNode && node.fileName === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}
