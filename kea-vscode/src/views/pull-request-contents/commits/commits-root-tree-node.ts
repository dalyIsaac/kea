import * as vscode from "vscode";
import { IKeaContext } from "../../../core/context";
import { Logger } from "../../../core/logger";
import { IKeaRepository } from "../../../repository/kea-repository";
import { LocalCommitsService } from "../../../services/local-commits-service";
import { PullRequest, PullRequestId } from "../../../types/kea";
import { CollapsibleState, getCollapsibleState, IParentTreeNode } from "../../tree-node";
import { LocalCommitTreeNode } from "../local-commit/local-commit-tree-node";
import { CommitTreeNode } from "./commit-tree-node";

/**
 * Provides information about the commits in the current pull request.
 */
export class CommitsRootTreeNode implements IParentTreeNode<CommitTreeNode | LocalCommitTreeNode> {
  #contextValue = "commit";
  #iconPath = new vscode.ThemeIcon("git-commit");
  #repository: IKeaRepository;
  #ctx: IKeaContext;
  #pullRequest: PullRequest | undefined;
  #localCommitsService: LocalCommitsService;

  pullId: PullRequestId;
  collapsibleState: CollapsibleState = "collapsed";

  constructor(repository: IKeaRepository, pullId: PullRequestId, ctx: IKeaContext, pullRequest?: PullRequest) {
    this.#repository = repository;
    this.pullId = pullId;
    this.#ctx = ctx;
    this.#pullRequest = pullRequest;
    this.#localCommitsService = new LocalCommitsService(ctx, repository.account.accountKey, repository.repoId);
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
    return this.#localCommitsService.getLocalCommits(this.#pullRequest);
  };
}
