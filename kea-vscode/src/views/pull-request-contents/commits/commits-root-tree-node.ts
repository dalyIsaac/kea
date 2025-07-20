import * as vscode from "vscode";
import { IKeaContext } from "../../../core/context";
import { Logger } from "../../../core/logger";
import { IKeaRepository } from "../../../repository/kea-repository";
import { PullRequest, PullRequestId } from "../../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../../tree-node";
import { CommitTreeNode } from "./commit-tree-node";
import { LocalCommitTreeNode } from "./local-commit-tree-node";

/**
 * Provides information about the commits in the current pull request.
 */
export class CommitsRootTreeNode implements IParentTreeNode<CommitTreeNode | LocalCommitTreeNode> {
  #contextValue = "commit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  #repository: IKeaRepository;
  #ctx: IKeaContext;
  #pullRequest: PullRequest | undefined;

  pullId: PullRequestId;
  collapsibleState: CollapsibleState = "collapsed";

  constructor(repository: IKeaRepository, pullId: PullRequestId, ctx: IKeaContext, pullRequest?: PullRequest) {
    this.#repository = repository;
    this.pullId = pullId;
    this.#ctx = ctx;
    this.#pullRequest = pullRequest;
  }

  getTreeItem = (): vscode.TreeItem => {
    const treeItem = new vscode.TreeItem("Commits", getCollapsibleState(this.collapsibleState));
    treeItem.contextValue = this.#contextValue;
    treeItem.iconPath = this.#iconPath;
    
    // Add description in the background (don't await to avoid blocking the tree)
    void this.#addBranchStatusDescription(treeItem);
    
    return treeItem;
  };

  #addBranchStatusDescription = async (treeItem: vscode.TreeItem): Promise<void> => {
    try {
      // Try to get the first workspace folder to check local git status
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceFolder = workspaceFolders[0];
      if (!workspaceFolder) {
        return;
      }

      const localGitRepo = await this.#ctx.gitManager.getLocalGitRepository(workspaceFolder);
      if (localGitRepo instanceof Error) {
        return;
      }

      const branchStatus = await localGitRepo.getBranchStatus();
      if (branchStatus instanceof Error) {
        return;
      }

      if (branchStatus.ahead > 0 || branchStatus.behind > 0) {
        const parts: string[] = [];
        if (branchStatus.ahead > 0) {
          parts.push(`↑${branchStatus.ahead}`);
        }
        if (branchStatus.behind > 0) {
          parts.push(`↓${branchStatus.behind}`);
        }
        treeItem.description = parts.join(" ");
        
        // Refresh the tree to show the updated description
        // Note: This is a fire-and-forget operation
        setTimeout(() => {
          this.#ctx.pullRequestContents.treeViewProvider.refresh();
        }, 100);
      }
    } catch (error) {
      Logger.debug("Failed to get branch status for tree item description", error);
    }
  };

  getChildren = async (): Promise<Array<CommitTreeNode | LocalCommitTreeNode>> => {
    // First try to get local commits if we're in a workspace
    const localCommits = await this.#getLocalCommits();
    if (localCommits && localCommits.length > 0) {
      return localCommits;
    }

    // Fall back to remote commits from API
    const commits = await this.#repository.getPullRequestCommits(this.pullId);

    if (commits instanceof Error) {
      Logger.error("Error fetching pull request commits", commits);
      vscode.window.showErrorMessage(`Error fetching pull request commits: ${commits.message}`);
      return [];
    }

    return commits.map((commit) => new CommitTreeNode(this.#repository, commit));
  };

  #getLocalCommits = async (): Promise<LocalCommitTreeNode[] | null> => {
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
      if (this.#pullRequest) {
        const targetBranch = `origin/${this.#pullRequest.base.ref}`;
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

      return commits.map((commit) => new LocalCommitTreeNode(localGitRepo, commit, workspaceFolder, this.#ctx, this.#repository.account.accountKey, this.#repository.repoId));
    } catch (error) {
      Logger.debug("Error getting local commits", error);
      return null;
    }
  };
}
