import * as vscode from "vscode";
import { Uri } from "vscode";
import { API, GitExtension, Repository } from "../types/git";

export const getRepo = async (uri: Uri): Promise<Repository | Error> => {
  const api = await getGitApi();
  if (api instanceof Error) {
    return api;
  }

  // Open the repository if it is not already opened. This can occur if the Kea extension is
  // activated before the Git extension.
  const repo = api.getRepository(uri) ?? (await api.openRepository(uri));
  if (repo === null) {
    return new Error(`No repository found for ${uri.toString()}`);
  }

  return repo;
};

const getGitApi = async (): Promise<API | Error> => {
  const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (gitExtension === undefined) {
    return new Error("Git extension not found");
  }

  if (!gitExtension.isActive) {
    try {
      await gitExtension.activate();
    } catch (error) {
      return new Error(`Failed to activate Git extension: ${error}`);
    }
  }

  return gitExtension.exports.getAPI(1);
};
