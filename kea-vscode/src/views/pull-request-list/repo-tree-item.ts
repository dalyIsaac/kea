import * as vscode from "vscode";
import { WorkspaceFolder } from "vscode";
import { GitHubAccount } from "../../account/github/github-account";
import { AppContext } from "../../core/app-context";
import { getRepo } from "../../core/git";
import { Logger } from "../../core/logger";
import { Repository } from "../../types/git";
import { RepoId } from "../../types/kea";

export class RepoTreeItem extends vscode.TreeItem {
  // Overrides.
  contextValue = "repository";

  // Properties.
  workspace: WorkspaceFolder;
  repo: Repository;
  remoteUrl: string;
  repoId: RepoId;

  private constructor(workspace: WorkspaceFolder, repo: Repository, repoUrl: string, repoId: RepoId) {
    super(workspace.name, vscode.TreeItemCollapsibleState.Collapsed);

    this.workspace = workspace;
    this.repo = repo;
    this.remoteUrl = repoUrl;
    this.repoId = repoId;

    this.description = repoUrl;
  }

  static create = async (workspace: WorkspaceFolder): Promise<RepoTreeItem | Error> => {
    const repo = await getRepo(workspace.uri);
    if (repo instanceof Error) {
      return repo;
    }

    const remote = repo.state.remotes[0];
    if (remote === undefined) {
      return new Error("No remotes found");
    }

    const repoUrl = remote.fetchUrl ?? remote.pushUrl;
    if (repoUrl === undefined) {
      return new Error("No fetch or push URL found");
    }

    const [owner, repoName] = repoUrl.replace(".git", "").split("/").slice(-2);
    if (owner === undefined || repoName === undefined) {
      return new Error("Invalid repository URL");
    }

    if (GitHubAccount.isGitHubUrl(repoUrl)) {
      const gitHubAccount = await AppContext.getGitHubAccount();

      if (gitHubAccount instanceof Error) {
        Logger.error(`Error creating GitHub account: ${gitHubAccount.message}`);
      }
    }

    return new RepoTreeItem(workspace, repo, repoUrl, { owner, repo: repoName });
  };
}
