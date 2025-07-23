import * as vscode from "vscode";
import { WrappedError } from "../core/wrapped-error";
import { GitApi, GitExtension, Repository as GitExtensionRepository } from "../types/git";

export interface IGitManager {
  getGitExtensionRepository: (workspaceFolder: vscode.WorkspaceFolder) => Promise<GitExtensionRepository | Error>;
}

export class GitManager implements IGitManager {
  #gitApi: GitApi | undefined = undefined;

  #getGitApi = async (): Promise<GitApi | Error> => {
    if (this.#gitApi) {
      return this.#gitApi;
    }

    const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");
    if (gitExtension === undefined) {
      return new Error("Git extension not found");
    }

    if (!gitExtension.isActive) {
      try {
        await gitExtension.activate();
      } catch (error) {
        return new WrappedError("Failed to activate Git extension", error);
      }
    }

    this.#gitApi = gitExtension.exports.getAPI(1);
    return this.#gitApi;
  };

  getGitExtensionRepository = async (workspaceFolder: vscode.WorkspaceFolder): Promise<GitExtensionRepository | Error> => {
    const api = await this.#getGitApi();
    if (api instanceof Error) {
      return api;
    }

    // Open the repository if it is not already opened. This can occur if the Kea extension is
    // activated before the Git extension.
    const repo = api.getRepository(workspaceFolder.uri) ?? (await api.openRepository(workspaceFolder.uri));
    if (repo === null) {
      return new Error(`No repository found for ${workspaceFolder.uri.toString()}`);
    }

    return repo;
  };
}
