import * as vscode from "vscode";
import { IApiCache } from "../cache/api/api-cache";
import { IRepository } from "../repository/repository";

export interface IAccountKey {
  providerId: string;
  accountId: string;
}

export interface IAccount {
  accountKey: IAccountKey;
  isRepoForAccount: (repoUrl: string) => boolean;
  createRepositoryForAccount: (repoUrl: string, workspaceFolder: vscode.WorkspaceFolder, cache: IApiCache) => IRepository | Error;
}
