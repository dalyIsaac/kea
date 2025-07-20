import * as path from "path";
import * as vscode from "vscode";
import { IAccountKey } from "../../../account/account";
import { IKeaContext } from "../../../core/context";
import { ILocalGitRepository, LocalCommit } from "../../../git/local-git-repository";
import { FileComment, RepoId } from "../../../types/kea";
import { BaseFileTreeNode } from "../base-file-tree-node";

/**
 * Represents a file in a local commit tree, extending BaseFileTreeNode functionality.
 */
export class LocalFileTreeNode extends BaseFileTreeNode {
  #localGitRepo: ILocalGitRepository;
  #commit: LocalCommit;
  #workspaceFolder: vscode.WorkspaceFolder;
  #ctx: IKeaContext;

  filePath: string;
  status: string;

  constructor(
    localGitRepo: ILocalGitRepository,
    commit: LocalCommit,
    workspaceFolder: vscode.WorkspaceFolder,
    filePath: string,
    status: string,
    ctx: IKeaContext,
    _accountKey: IAccountKey,
    _repoId: RepoId,
    comments: FileComment[] = [],
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileName = filePath.split("/").pop()!;
    const fileUri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filePath));

    super(fileName, fileUri, comments, "localFile", ctx);

    this.#localGitRepo = localGitRepo;
    this.#commit = commit;
    this.#workspaceFolder = workspaceFolder;
    this.#ctx = ctx;
    this.filePath = filePath;
    this.status = status;
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = this.createBaseTreeItem();
    treeItem.tooltip = `${this.filePath} (${this.status})`;

    treeItem.command = this.#ctx.commandManager.getCommand("kea.openCommitFileDiff", "Open File Diff", {
      commitSha: this.#commit.sha,
      filePath: this.filePath,
      workspacePath: this.#workspaceFolder.uri.fsPath,
      localGitRepo: this.#localGitRepo,
    });

    treeItem.description = this.status;

    return treeItem;
  };
}
