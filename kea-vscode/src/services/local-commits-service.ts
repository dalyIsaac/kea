import * as vscode from "vscode";
import { IAccountKey } from "../account/account";
import { IKeaContext } from "../core/context";
import { Logger } from "../core/logger";
import { LocalCommit } from "../git/local-git-repository";
import { PullRequest, RepoId } from "../types/kea";
import { LocalCommitTreeNode } from "../views/common/local-commit/local-commit-tree-node";

/**
 * Service for handling local Git repository integration and commit retrieval.
 */
export class LocalCommitsService {
  #ctx: IKeaContext;
  #accountKey: IAccountKey;
  #repoId: RepoId;

  constructor(ctx: IKeaContext, accountKey: IAccountKey, repoId: RepoId) {
    this.#ctx = ctx;
    this.#accountKey = accountKey;
    this.#repoId = repoId;
  }

  /**
   * Gets local commits for display in the commits tree.
   * @param pullRequest Optional pull request context for determining target branch.
   * @returns Array of LocalCommitTreeNode instances or null if no local git repository is available.
   */
  getLocalCommits = async (pullRequest?: PullRequest): Promise<LocalCommitTreeNode[] | null> => {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
      }

      const workspaceFolder = workspaceFolders[0];
      if (!workspaceFolder) {
        return null;
      }

      const localGitRepo = await this.#ctx.gitManager.getLocalGitRepository(workspaceFolder);
      if (localGitRepo instanceof Error) {
        Logger.debug("No local git repository available", localGitRepo);
        return null;
      }

      let commits;

      // If we have pull request info, get commits ahead of the base branch.
      if (pullRequest) {
        const targetBranch = `origin/${pullRequest.base.ref}`;
        commits = await localGitRepo.getBranchCommitsAheadOf(targetBranch, 20);

        // Fall back to regular branch commits if the ahead-of method fails.
        if (commits instanceof Error) {
          Logger.debug(`Failed to get commits ahead of ${targetBranch}, falling back to all branch commits`, commits);
          commits = await localGitRepo.getBranchCommits(20);
        }
      } else {
        // No pull request context, get all branch commits.
        commits = await localGitRepo.getBranchCommits(20);
      }

      if (commits instanceof Error) {
        Logger.debug("Failed to get local commits", commits);
        return null;
      }

      // Convert local commits to tree nodes.
      return commits.map(
        (commit: LocalCommit) => new LocalCommitTreeNode(localGitRepo, commit, workspaceFolder, this.#ctx, this.#accountKey, this.#repoId),
      );
    } catch (error) {
      Logger.debug("Error in getLocalCommits", error);
      return null;
    }
  };
}
