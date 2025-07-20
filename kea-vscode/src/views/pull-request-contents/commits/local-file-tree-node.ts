import * as path from "path";
import * as vscode from "vscode";
import { IAccountKey } from "../../../account/account";
import { IKeaContext } from "../../../core/context";
import { ILocalGitRepository, LocalCommit } from "../../../git/local-git-repository";
import { CommitFile, FileComment, RepoId } from "../../../types/kea";
import { FileTreeNode } from "../../common/file-tree-node";

/**
 * Represents a file in a local commit tree, extending FileTreeNode functionality.
 */
export class LocalFileTreeNode extends FileTreeNode {
  #localGitRepo: ILocalGitRepository;
  #commit: LocalCommit;
  #workspaceFolder: vscode.WorkspaceFolder;
  #ctx: IKeaContext;
  
  filePath: string;
  status: string;
  
  constructor(localGitRepo: ILocalGitRepository, commit: LocalCommit, workspaceFolder: vscode.WorkspaceFolder, filePath: string, status: string, ctx: IKeaContext, accountKey: IAccountKey, repoId: RepoId) {
    const commitFile: CommitFile = {
      filename: filePath,
      sha: commit.sha,
      status: status as CommitFile['status'],
      additions: 0,
      deletions: 0,
      changes: 0,
      patch: null,
      blobUrl: '',
      rawUrl: '',
      contentsUrl: ''
    };
    
    super(accountKey, repoId, commitFile, [] as FileComment[], ctx);
    
    this.#localGitRepo = localGitRepo;
    this.#commit = commit;
    this.#workspaceFolder = workspaceFolder;
    this.#ctx = ctx;
    this.filePath = filePath;
    this.status = status;
  }
  
  override getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem(this.fileName, vscode.TreeItemCollapsibleState.None);
    treeItem.resourceUri = vscode.Uri.file(path.join(this.#workspaceFolder.uri.fsPath, this.filePath));
    treeItem.contextValue = "localFile";
    treeItem.iconPath = new vscode.ThemeIcon("file");
    treeItem.tooltip = `${this.filePath} (${this.status})`;
    
    treeItem.command = this.#ctx.commandManager.getCommand(
      "kea.openCommitFileDiff",
      "Open File Diff",
      {
        commitSha: this.#commit.sha,
        filePath: this.filePath,
        workspacePath: this.#workspaceFolder.uri.fsPath,
        localGitRepo: this.#localGitRepo,
      }
    );
    
    treeItem.description = this.status;
    
    return treeItem;
  };
}