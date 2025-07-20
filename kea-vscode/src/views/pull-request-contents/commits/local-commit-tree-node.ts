import * as vscode from "vscode";
import { ILocalGitRepository, LocalCommit } from "../../../git/local-git-repository";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../../tree-node";
import { LocalFileTreeNode } from "./local-file-tree-node";
import { LocalFolderTreeNode } from "./local-folder-tree-node";
import { IKeaContext } from "../../../core/context";

export type LocalCommitTreeNodeChild = LocalFileTreeNode | LocalFolderTreeNode;

/**
 * Provides information about a local commit from the git repository.
 */
export class LocalCommitTreeNode implements IParentTreeNode<LocalCommitTreeNodeChild> {
  #contextValue = "localCommit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  #localGitRepo: ILocalGitRepository;
  #workspaceFolder: vscode.WorkspaceFolder;
  #ctx: IKeaContext;
  
  commit: LocalCommit;
  collapsibleState: CollapsibleState = "collapsed";

  constructor(localGitRepo: ILocalGitRepository, commit: LocalCommit, workspaceFolder: vscode.WorkspaceFolder, ctx: IKeaContext) {
    this.#localGitRepo = localGitRepo;
    this.commit = commit;
    this.#workspaceFolder = workspaceFolder;
    this.#ctx = ctx;
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
    const commitFiles = await this.#localGitRepo.getCommitFiles(this.commit.sha);

    if (commitFiles instanceof Error) {
      vscode.window.showErrorMessage(`Error fetching commit files: ${commitFiles.message}`);
      return [];
    }

    return this.#toTree(commitFiles);
  };

  #toTree = (files: Array<{ filename: string; status: string }>): LocalCommitTreeNodeChild[] => {
    const sortedFiles = files.sort((a, b) => a.filename.localeCompare(b.filename));
    let roots: LocalCommitTreeNodeChild[] = [];

    for (const file of sortedFiles) {
      roots = this.#fileToTree(roots, file);
    }

    return roots;
  };

  #fileToTree = (roots: LocalCommitTreeNodeChild[], file: { filename: string; status: string }): LocalCommitTreeNodeChild[] => {
    let parents = roots;
    const pathParts = file.filename.split("/");

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
    const fileNode = new LocalFileTreeNode(this.#localGitRepo, this.commit, this.#workspaceFolder, file.filename, file.status, this.#ctx);

    if (!parents.some((node) => node instanceof LocalFileTreeNode && node.fileName === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}