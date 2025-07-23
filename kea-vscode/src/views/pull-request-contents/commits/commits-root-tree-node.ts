import * as vscode from "vscode";
import { IKeaContext } from "../../../core/context";
import { Logger } from "../../../core/logger";
import { IRepository } from "../../../repository/repository";
import { PullRequest, PullRequestId } from "../../../types/kea";
import { LocalCommitTreeNode } from "../../common/local-commit/local-commit-tree-node";
import { RemoteCommitTreeNode } from "../../common/remote-commit/remote-commit-tree-node";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../../tree-node";

/**
 * Provides information about the commits in the current pull request.
 */
export class CommitsRootTreeNode implements IParentTreeNode<RemoteCommitTreeNode | LocalCommitTreeNode> {
  #contextValue = "commit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  #repository: IRepository;
  #ctx: IKeaContext;
  #pullRequest: PullRequest | undefined;

  pullId: PullRequestId;
  collapsibleState: CollapsibleState = "collapsed";

  constructor(repository: IRepository, pullId: PullRequestId, ctx: IKeaContext, pullRequest?: PullRequest) {
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

      const branchStatus = await this.#repository.localRepository.getBranchStatus();
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
      }
    } catch (error) {
      Logger.debug("Failed to get branch status for tree item description", error);
    }
  };

  getChildren = async (): Promise<Array<RemoteCommitTreeNode | LocalCommitTreeNode>> => {
    // Always get remote commits first for ahead/behind status and remote-only commits
    const remoteCommits = await this.#repository.remoteRepository.getPullRequestCommits(this.pullId);
    if (remoteCommits instanceof Error) {
      Logger.error("Error fetching pull request commits", remoteCommits);
      vscode.window.showErrorMessage(`Error fetching pull request commits: ${remoteCommits.message}`);
    }

    // Try to get local commits if we're in a workspace
    const localCommits = await this.#getLocalCommits();

    // Combine local and remote commits, prioritizing local commits for commits that exist locally
    const allCommits: Array<RemoteCommitTreeNode | LocalCommitTreeNode> = [];

    if (localCommits && localCommits.length > 0) {
      // Local commits are already sorted by date (newest first) from git log
      allCommits.push(...localCommits);
    }

    // Add remote commits that don't exist locally
    if (!(remoteCommits instanceof Error)) {
      const localCommitShas = new Set(localCommits?.map((c) => c.commit.sha) ?? []);
      const remoteOnlyCommits = remoteCommits
        .filter((commit) => !localCommitShas.has(commit.sha))
        .map((commit) => new RemoteCommitTreeNode(this.#ctx, this.#repository, commit));
      allCommits.push(...remoteOnlyCommits);
    }

    return allCommits;
  };

  #getLocalCommits = async (): Promise<LocalCommitTreeNode[] | null> => {
    const localCommits = await this.#repository.localRepository.getCommitsForPullRequest(this.#pullRequest?.base.ref);
    if (localCommits instanceof Error) {
      Logger.error("Error fetching local commits for pull request", localCommits);
      return null;
    }

    return localCommits.map((commit) => new LocalCommitTreeNode(this.#ctx, this.#repository, commit));
  };
}
