import { Uri } from "vscode";
import { vscode } from "./types/aliases";
import { API, GitExtension, Repository } from "./types/git";

const getApi = (): API | null => {
  const gitExtension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (gitExtension === undefined) {
    return null;
  }

  try {
    return gitExtension.exports.getAPI(1);
  } catch (error) {
    console.error("Failed to get Git API:", error);
    return null;
  }
};

export const getRepo = (uri: Uri): Repository | null => {
  const api = getApi();
  if (api === null) {
    return null;
  }

  const repo = api.getRepository(uri);
  if (repo === null) {
    return null;
  }

  return repo;
};
