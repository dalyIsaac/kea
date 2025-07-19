import * as vscode from "vscode";
import { createKeaCommand } from "../../commands/create-command";
import { createGitDecorationUri } from "../../decorations/decoration-schemes";
import { IKeaRepository } from "../../repository/kea-repository";
import { Commit, CommitFile, FileComment } from "../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../tree-node";
import { ReviewCommentTreeNode } from "./review-comment-tree-node";

/**
 * Tree item representing a file.
 */
export class FileTreeNode implements IParentTreeNode<ReviewCommentTreeNode> {
  #contextValue = "file";
  #iconPath = new vscode.ThemeIcon("file");
  #tooltip = "File";
  #resourceUri: vscode.Uri;

  #repository: IKeaRepository;
  #commitFile: CommitFile;

  #comments: FileComment[];
  #commit: Commit;
  fileName: string;

  collapsibleState: CollapsibleState;

  constructor(repository: IKeaRepository, file: CommitFile, comments: FileComment[], commit: Commit) {
    this.#repository = repository;
    this.#commitFile = file;
    this.#commit = commit;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.fileName = file.filename.split("/").pop()!;
    this.collapsibleState = comments.length > 0 ? "collapsed" : "none";
    this.#resourceUri = createGitDecorationUri({
      accountKey: repository.account.accountKey,
      filePath: file.filename,
      repoId: repository.repoId,
      fileStatus: file.status,
    });

    this.#comments = comments;
  }

  getTreeItem = async (): Promise<vscode.TreeItem> => {
    const treeItem = new vscode.TreeItem(this.fileName, getCollapsibleState(this.collapsibleState));
    treeItem.resourceUri = this.#resourceUri;
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    treeItem.tooltip = this.#tooltip;

    if (this.#comments.length > 0) {
      treeItem.description = `${this.#comments.length} comment${this.#comments.length > 1 ? "s" : ""}`;
    }

    const oldFile = await this.#getOldFile(this.#commitFile);

    treeItem.command = createKeaCommand({
      title: "Show Comments",
      command: "kea.showFiles",
      args: [
        {
          accountKey: this.#repository.account.accountKey,
          repoId: this.#repository.repoId,
          oldFile: oldFile
            ? {
                fileSha: oldFile.sha,
                filename: oldFile.filename,
              }
            : undefined,
          newFile: {
            fileSha: this.#commitFile.sha,
            filename: this.#commitFile.filename,
          },
          status: this.#commitFile.status,
        },
      ],
    });

    return treeItem;
  };

  #getOldFile = async (file: CommitFile): Promise<CommitFile | undefined> => {
    // TODO: Handle multiple parents for merge commits
    const previousCommit = this.#commit.parents[0];
    if (previousCommit === undefined) {
      return undefined;
    }

    // TODO: Change this to get the hash of the file in the previous commit, not the files changed in the previous commit.
    const commitFiles = await this.#repository.getCommitFiles(previousCommit.sha);
    if (commitFiles instanceof Error) {
      return undefined;
    }

    return commitFiles.find((f) => f.filename === file.filename);
  };

  getChildren = (): ReviewCommentTreeNode[] => {
    const commentItems = this.#comments.map((comment) => new ReviewCommentTreeNode(comment));
    return commentItems.sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  };
}
