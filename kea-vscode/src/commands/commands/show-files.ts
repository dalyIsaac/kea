import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { FileStatus, RepoId } from "../../types/kea";
import { createVscodeCommand } from "../create-command";

interface IShowFilesGitBlob {
  fileSha: string;
  filename: string;
}

export interface IShowFilesCommandArgs {
  accountKey: IAccountKey;
  repoId: RepoId;
  oldFile?: IShowFilesGitBlob | undefined;
  newFile: IShowFilesGitBlob;
  status: FileStatus;
}

export const createShowFiles =
  (ctx: IKeaContext) =>
  async (args: IShowFilesCommandArgs): Promise<Error | void> => {
    const command = new ShowFilesCommand(ctx, args);
    return command.execute();
  };

class ShowFilesCommand {
  #ctx: IKeaContext;
  #args: IShowFilesCommandArgs;
  #repository: IKeaRepository | undefined;

  constructor(ctx: IKeaContext, args: IShowFilesCommandArgs) {
    this.#ctx = ctx;
    this.#args = args;
  }

  async execute(): Promise<Error | void> {
    const [oldFileUri, newFileUri] = await Promise.all([
      this.#args.oldFile ? this.#getFileUri(this.#args.oldFile) : undefined,
      this.#getFileUri(this.#args.newFile),
    ]);

    if (oldFileUri instanceof Error) {
      Logger.error("Error getting old file URI", oldFileUri);
      vscode.window.showErrorMessage(`Error getting old file URI: ${oldFileUri.message}`);
      return;
    }

    if (newFileUri instanceof Error) {
      Logger.error("Error getting new file URI", newFileUri);
      vscode.window.showErrorMessage(`Error getting new file URI: ${newFileUri.message}`);
      return;
    }

    const options: vscode.TextDocumentShowOptions = {
      preview: true,
      viewColumn: vscode.ViewColumn.Beside,
    };

    if (oldFileUri === undefined) {
      await vscode.commands.executeCommand(...createVscodeCommand("vscode.open", newFileUri, options, this.#args.newFile.filename));
    } else {
      const label = `${this.#args.oldFile?.filename} ↔ ${this.#args.newFile.filename}`;
      await vscode.commands.executeCommand(...createVscodeCommand("vscode.diff", oldFileUri, newFileUri, label, options));
    }
  }

  #getFileUri = async (file: IShowFilesGitBlob): Promise<vscode.Uri | Error> => {
    const fileCacheValue = await this.#ctx.fileCache.get(this.#args.repoId, file.fileSha);
    if (!(fileCacheValue instanceof Error)) {
      return fileCacheValue.data;
    }

    const repository = this.#repository ?? this.#ctx.repositoryManager.getRepositoryById(this.#args.accountKey, this.#args.repoId);
    if (repository instanceof Error) {
      return repository;
    }

    this.#repository = repository;
    return this.#repository.getBlobUri(file.fileSha);
  };
}
