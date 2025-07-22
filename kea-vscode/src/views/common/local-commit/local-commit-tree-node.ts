import * as vscode from "vscode";
import { IKeaContext } from "../../../core/context";
import { LocalCommit, LocalCommitFile } from "../../../git/local-git-repository";
import { IRepository } from "../../../repository/repository";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../../tree-node";
import { LocalFileTreeNode } from "./local-file-tree-node";
import { LocalFolderTreeNode } from "./local-folder-tree-node";

export type LocalCommitTreeNodeChild = LocalFileTreeNode | LocalFolderTreeNode;

/**
 * Provides information about a local commit from the git repository.
 */
export class LocalCommitTreeNode implements IParentTreeNode<LocalCommitTreeNodeChild> {
  #ctx: IKeaContext;
  #repository: IRepository;

  #contextValue = "localCommit";
  #iconPath = new vscode.ThemeIcon("git-branch");

  commit: LocalCommit;
  collapsibleState: CollapsibleState = "collapsed";

  constructor(ctx: IKeaContext, repository: IRepository, commit: LocalCommit) {
    this.#ctx = ctx;

    this.#repository = repository;
    this.commit = commit;
  }

  getTreeItem = (): vscode.TreeItem => {
    let commitTitle = this.commit.message.split("\n")[0];

    // Handle empty string explicitly.
    if (commitTitle === "") {
      commitTitle = "<Empty commit>";
    }
    commitTitle = commitTitle ?? "<Empty commit>";

    const treeItem = new vscode.TreeItem(commitTitle, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = `${this.commit.message}\n\nAuthor: ${this.commit.author}\nDate: ${this.commit.date.toLocaleString()}\nSHA: ${this.commit.sha}`;
    treeItem.description = this.commit.sha.substring(0, 7);

    return treeItem;
  };

  getChildren = async (): Promise<LocalCommitTreeNodeChild[]> => {
    const commitFiles = await this.#repository.localRepository.getCommitFiles(this.commit.sha);

    if (commitFiles instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching commit files: ${commitFiles.message}`);
      return [];
    }

    return this.#toTree(commitFiles);
  };

  #toTree = (files: LocalCommitFile[]): LocalCommitTreeNodeChild[] => {
    const sortedFiles = files.sort((a, b) => a.filePath.localeCompare(b.filePath));
    let roots: LocalCommitTreeNodeChild[] = [];

    for (const file of sortedFiles) {
      roots = this.#fileToTree(roots, file);
    }

    return roots;
  };

  #fileToTree = (roots: LocalCommitTreeNodeChild[], file: LocalCommitFile): LocalCommitTreeNodeChild[] => {
    let parents = roots;
    const pathParts = file.filePath.split("/");

    for (let idx = 0; idx < pathParts.length - 1; idx += 1) {
      const folderName = pathParts[idx];
      const folderPath = pathParts.slice(0, idx + 1).join("/");

      let folderNode = parents.find((node) => node instanceof LocalFolderTreeNode && node.folderName === folderName);
      if (folderNode === undefined) {
        folderNode = new LocalFolderTreeNode(folderPath);
        parents.push(folderNode);
      }

      parents = (folderNode as LocalFolderTreeNode).children;
    }

    const fileName = pathParts[pathParts.length - 1];
    const fileNode = new LocalFileTreeNode(this.#ctx, this.#repository.localRepository, this.commit, file, []);

    if (!parents.some((node) => node instanceof LocalFileTreeNode && node.fileName === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}
