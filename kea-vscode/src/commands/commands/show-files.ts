import * as vscode from "vscode";
import { IAccountKey } from "../../account/account";
import { IKeaContext } from "../../core/context";
import { Logger } from "../../core/logger";
import { IKeaRepository } from "../../repository/kea-repository";
import { KeaDiffTextDocumentProvider } from "../../text-document-content-providers/kea-diff-text-document-provider";
import { FileRef, FileStatus, RepoId } from "../../types/kea";
import { createVscodeCommand } from "../create-command";

export interface IShowFilesCommandArgs {
  accountKey: IAccountKey;
  repoId: RepoId;
  oldFile?: FileRef | undefined;
  newFile?: FileRef | undefined;
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
    const [oldFileResult, newFileResult] = await Promise.all([this.#getFileUri(this.#args.oldFile), this.#getFileUri(this.#args.newFile)]);

    if (oldFileResult instanceof Error) {
      Logger.error("Error getting old file URI", oldFileResult);
      vscode.window.showErrorMessage(`Error getting old file URI: ${oldFileResult.message}`);
      return;
    }

    if (newFileResult instanceof Error) {
      Logger.error("Error getting new file URI", newFileResult);
      vscode.window.showErrorMessage(`Error getting new file URI: ${newFileResult.message}`);
      return;
    }

    const options: vscode.TextDocumentShowOptions = {
      preview: true,
      // viewColumn: vscode.ViewColumn.Beside,
    };

    if (oldFileResult === undefined && newFileResult !== undefined) {
      await vscode.commands.executeCommand(...createVscodeCommand("vscode.open", newFileResult.uri, options, newFileResult.filename));
      return;
    }

    if (oldFileResult !== undefined && newFileResult === undefined) {
      await vscode.commands.executeCommand(...createVscodeCommand("vscode.open", oldFileResult.uri, options, oldFileResult.filename));
      return;
    }

    if (oldFileResult !== undefined && newFileResult !== undefined) {
      const label = `${oldFileResult.filename} ↔ ${newFileResult.filename}`;
      await vscode.commands.executeCommand(...createVscodeCommand("vscode.diff", oldFileResult.uri, newFileResult.uri, label, options));
      return;
    }

    Logger.error("Both old and new file URIs are undefined");
    vscode.window.showErrorMessage("Both old and new file URIs are undefined");
  }

  #getFileUri = async (file: FileRef | undefined): Promise<{ uri: vscode.Uri; filename: string } | undefined | Error> => {
    if (file === undefined) {
      Logger.debug("File reference is undefined");
      return undefined;
    }

    const fileCacheValue = await this.#ctx.fileCache.get(this.#args.repoId, file.fileSha);
    if (!(fileCacheValue instanceof Error)) {
      return { uri: fileCacheValue.data, filename: file.filename };
    }

    const repository = this.#repository ?? this.#ctx.repositoryManager.getRepositoryById(this.#args.accountKey, this.#args.repoId);
    if (repository instanceof Error) {
      return repository;
    }

    this.#repository = repository;
    const blobUri = await this.#repository.getBlobUri(file.fileSha);

    if (blobUri instanceof Error) {
      return blobUri;
    }
    return { uri: KeaDiffTextDocumentProvider.createKeaDiffUri(blobUri), filename: file.filename };
  };
}
