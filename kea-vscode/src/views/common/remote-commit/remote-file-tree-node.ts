import * as vscode from "vscode";
import { IAccountKey } from "../../../account/account";
import { IKeaContext } from "../../../core/context";
import { createGitDecorationUri } from "../../../decorations/decoration-schemes";
import { CommitFile, FileComment, RepoId } from "../../../types/kea";
import { BaseFileTreeNode } from "../../common/base-file-tree-node";

/**
 * Tree item representing a remote file.
 */
export class RemoteFileTreeNode extends BaseFileTreeNode {
  #resourceUri: vscode.Uri;

  constructor(accountKey: IAccountKey, repoId: RepoId, file: CommitFile, comments: FileComment[], ctx?: IKeaContext) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileName = file.filename.split("/").pop()!;
    const fileUri = vscode.Uri.file(file.filename);

    super(fileName, fileUri, comments, "file", ctx);

    this.#resourceUri = createGitDecorationUri({
      accountKey,
      filePath: file.filename,
      repoId,
      fileStatus: file.status,
    });
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = this.createBaseTreeItem();

    if (this.ctx) {
      treeItem.command = this.ctx.commandManager.getCommand("kea.openCommitFileDiff", "Open File Diff", { resourceUri: this.#resourceUri });
    } else {
      treeItem.command = {
        command: "kea.openCommitFileDiff",
        title: "Open File Diff",
        arguments: [{ resourceUri: this.#resourceUri }],
      };
    }

    return treeItem;
  };
}
