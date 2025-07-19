import * as vscode from "vscode";
import { ILocalGitRepository, LocalCommit } from "../../../git/local-git-repository";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../../tree-node";

// Create a simplified local file tree node for local commits
export class LocalFileTreeNode {
  #contextValue = "localFile";
  #iconPath = new vscode.ThemeIcon("file");
  
  fileName: string;
  filePath: string;
  status: string;
  #localGitRepo: ILocalGitRepository;
  #commit: LocalCommit;
  #workspaceFolder: vscode.WorkspaceFolder;
  
  constructor(localGitRepo: ILocalGitRepository, commit: LocalCommit, workspaceFolder: vscode.WorkspaceFolder, filePath: string, status: string) {
    this.#localGitRepo = localGitRepo;
    this.#commit = commit;
    this.#workspaceFolder = workspaceFolder;
    this.filePath = filePath;
    this.status = status;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.fileName = filePath.split("/").pop()!;
  }
  
  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.fileName, vscode.TreeItemCollapsibleState.None);
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = `${this.filePath} (${this.status})`;
    
    // Add command to open file diff when clicked
    treeItem.command = {
      command: "kea.openCommitFileDiff",
      title: "Open File Diff",
      arguments: [{
        commitSha: this.#commit.sha,
        filePath: this.filePath,
        workspacePath: this.#workspaceFolder.uri.fsPath,
        localGitRepo: this.#localGitRepo,
      }],
    };
    
    // Show status in description
    treeItem.description = this.status;
    
    return treeItem;
  };
}

// Create a simple local folder tree node for local commits
export class LocalFolderTreeNode implements IParentTreeNode<LocalFileTreeNode | LocalFolderTreeNode> {
  #contextValue = "localFolder";
  #iconPath = new vscode.ThemeIcon("folder");
  #tooltip = "Folder";
  folderName: string;

  collapsibleState: CollapsibleState = "collapsed";
  children: Array<LocalFileTreeNode | LocalFolderTreeNode>;

  constructor(folderPath: string) {
    this.folderName = folderPath.split("/").pop() ?? folderPath;
    this.children = [];
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.folderName, getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;
    return treeItem;
  };

  getChildren = (): Array<LocalFileTreeNode | LocalFolderTreeNode> => this.children;
}

export type LocalCommitTreeNodeChild = LocalFileTreeNode | LocalFolderTreeNode;

/**
 * Provides information about a local commit from the git repository.
 */
export class LocalCommitTreeNode implements IParentTreeNode<LocalCommitTreeNodeChild> {
  #contextValue = "localCommit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  #localGitRepo: ILocalGitRepository;
  #workspaceFolder: vscode.WorkspaceFolder;
  
  commit: LocalCommit;
  collapsibleState: CollapsibleState = "collapsed";

  constructor(localGitRepo: ILocalGitRepository, commit: LocalCommit, workspaceFolder: vscode.WorkspaceFolder) {
    this.#localGitRepo = localGitRepo;
    this.commit = commit;
    this.#workspaceFolder = workspaceFolder;
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
    const fileNode = new LocalFileTreeNode(this.#localGitRepo, this.commit, this.#workspaceFolder, file.filename, file.status);

    if (!parents.some((node) => node instanceof LocalFileTreeNode && node.fileName === fileName)) {
      parents.push(fileNode);
    }

    return roots;
  };
}