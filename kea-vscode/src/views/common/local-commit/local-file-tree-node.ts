import * as path from "path";
import * as vscode from "vscode";
import { IKeaContext } from "../../../core/context";
import { createLocalFileDecorationUri } from "../../../decorations/decoration-schemes";
import { ILocalGitRepository, LocalCommit, LocalCommitFile } from "../../../git/local-git-repository";
import { FileComment } from "../../../types/kea";
import { BaseFileTreeNode } from "../base-file-tree-node";

/**
 * Represents a file in a local commit tree, extending BaseFileTreeNode functionality.
 */
export class LocalFileTreeNode extends BaseFileTreeNode {
  #localGitRepo: ILocalGitRepository;
  #commit: LocalCommit;
  #decorationUri: vscode.Uri;
  #file: LocalCommitFile;

  constructor(ctx: IKeaContext, localGitRepo: ILocalGitRepository, commit: LocalCommit, file: LocalCommitFile, comments: FileComment[]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileName = file.filePath.split("/").pop()!;
    const fileUri = vscode.Uri.file(path.join(localGitRepo.path, file.filePath));

    super(ctx, fileName, fileUri, comments, "localFile", file.status);

    this.#localGitRepo = localGitRepo;
    this.#commit = commit;
    this.#file = file;

    this.#decorationUri = createLocalFileDecorationUri({
      filePath: file.filePath,
      fileStatus: file.status,
    });
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = this.createBaseTreeItem();

    treeItem.command = this._ctx.commandManager.getCommand("kea.openCommitFileDiff", "Open File Diff", {
      commitSha: this.#commit.sha,
      filePath: this.#file.filePath,
      workspacePath: this.#localGitRepo.path,
      localGitRepo: this.#localGitRepo,
    });

    treeItem.description = this.#file.status;
    treeItem.resourceUri = this.#decorationUri;

    return treeItem;
  };
}
