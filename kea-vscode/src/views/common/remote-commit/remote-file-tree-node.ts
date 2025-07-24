import * as vscode from "vscode";
import { IKeaContext } from "../../../core/context";
import { createRemoteFileDecorationUri } from "../../../decorations/decoration-schemes";
import { IRemoteRepository } from "../../../repository/remote-repository";
import { CommitFile, FileComment } from "../../../types/kea";
import { BaseFileTreeNode } from "../../common/base-file-tree-node";

/**
 * Tree item representing a remote file.
 */
export class RemoteFileTreeNode extends BaseFileTreeNode {
  #decorationUri: vscode.Uri;

  constructor(ctx: IKeaContext, remoteRepo: IRemoteRepository, file: CommitFile, comments: FileComment[]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileName = file.filename.split("/").pop()!;
    const fileUri = vscode.Uri.file(file.filename);

    super(ctx, fileName, fileUri, comments, "file", file.status);

    this.#decorationUri = createRemoteFileDecorationUri({
      accountKey: remoteRepo.account.accountKey,
      filePath: file.filename,
      repoId: remoteRepo.repoId,
      fileStatus: file.status,
    });
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = this.createBaseTreeItem();

    treeItem.command = this._ctx.commandManager.createCommand("kea.openCommitFileDiff", "Open File Diff", {
      resourceUri: this.#decorationUri,
    });

    treeItem.resourceUri = this.#decorationUri;

    return treeItem;
  };
}
