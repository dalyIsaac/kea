import { execFile } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";
import { KeaDisposable } from "../core/kea-disposable";
import { Logger } from "../core/logger";
import { WrappedError } from "../core/wrapped-error";
import { Repository as GitExtensionRepository } from "../types/git";
import { FileStatus } from "../types/kea";

const execFileAsync = promisify(execFile);

export interface BranchStatus {
  /**
   * The number of commits the local branch is ahead of the remote tracking branch.
   */
  ahead: number;

  /**
   * The number of commits the local branch is behind the remote tracking branch.
   */
  behind: number;

  /**
   * The name of the remote tracking branch, or null if there is no remote tracking branch.
   */
  remoteBranch: string | null;
}

export interface LocalCommit {
  sha: string;
  message: string;
  author: string;
  date: Date;
}

export interface LocalCommitFile {
  filePath: string;
  status: FileStatus;
}

export interface ILocalGitRepository {
  /**
   * The workspace folder associated with this local Git repository.
   */
  get workspaceFolder(): vscode.WorkspaceFolder;

  /**
   * The path to the local Git repository.
   */
  get path(): string;

  /**
   * Get the contents of a specific file at a given commit.
   * @param treeish The commit SHA to retrieve the file from.
   * @param filePath The path to the file relative to the repository root.
   * @returns The file contents as a string, or an Error if the operation fails.
   */
  getFileAtCommit(treeish: string, filePath: string): Promise<string | Error>;

  /**
   * Get commits from the current branch that are ahead of the target branch.
   * @param targetBranch The target branch to compare against (e.g., 'main', 'origin/main').
   * @param limit Maximum number of commits to retrieve (default: 50).
   * @returns Array of commits from the current branch that are ahead of the target branch.
   */
  getBranchCommitsAheadOf(targetBranch: string, limit?: number): Promise<LocalCommit[] | Error>;

  /**
   * Get commits from the current branch.
   * @param limit Maximum number of commits to retrieve (default: 50).
   * @returns Array of commits from the current branch.
   */
  getBranchCommits(limit?: number): Promise<LocalCommit[] | Error>;

  /**
   * Get the ahead/behind status compared to the remote tracking branch.
   * @returns Status showing commits ahead and behind the remote.
   */
  getBranchStatus(): Promise<BranchStatus | Error>;

  /**
   * Get the current branch name.
   * @returns The name of the current branch.
   */
  getCurrentBranch(): Promise<string | Error>;

  /**
   * Get the current HEAD commit SHA.
   * @returns The current HEAD commit SHA.
   */
  getCurrentCommit(): Promise<string | Error>;

  /**
   * Get commits for a pull request context, trying ahead-of first, then fallback to regular branch commits.
   * @param pullRequestBaseBranch The base branch of the pull request (e.g., 'main').
   * @param limit Maximum number of commits to retrieve (default: 20).
   * @returns Array of commits, prioritizing commits ahead of the base branch.
   */
  getCommitsForPullRequest(pullRequestBaseBranch?: string, limit?: number): Promise<LocalCommit[] | Error>;

  /**
   * Get files changed in a specific commit.
   * @param treeish The commit SHA to get files for.
   * @returns Array of files changed in the commit.
   */
  getCommitFiles(treeish: string): Promise<LocalCommitFile[] | Error>;

  /**
   * Get the parent commit SHA for a given commit.
   * @param treeish The commit SHA to get the parent for.
   * @returns The parent commit SHA, or an Error if the operation fails.
   */
  getParentCommit(treeish: string): Promise<string | Error>;

  /**
   * Check if a commit exists in the repository.
   * @param treeish The commit SHA to check.
   * @returns True if the commit exists, false otherwise.
   */
  checkout(treeish: string): Promise<void | Error>;
}

/**
 * LocalGitRepository provides access to a Git repository through direct Git command execution.
 * This allows for operations that don't require GitHub API access.
 */
export class LocalGitRepository extends KeaDisposable implements ILocalGitRepository {
  #workspaceFolder: vscode.WorkspaceFolder;
  #gitExecutable: string;
  #gitExtensionRepository: GitExtensionRepository;

  constructor(workspaceFolder: vscode.WorkspaceFolder, vscodeRepository: GitExtensionRepository) {
    super();
    this.#workspaceFolder = workspaceFolder;
    this.#gitExecutable = this.#detectGitExecutable();
    this.#gitExtensionRepository = vscodeRepository;
  }

  /**
   * Detect the Git executable path based on the current platform
   */
  #detectGitExecutable = (): string => {
    // On Windows, Git might be in PATH as 'git' or 'git.exe'
    // On Unix-like systems, it's typically just 'git'
    return process.platform === "win32" ? "git.exe" : "git";
  };

  /**
   * Execute a Git command in the repository directory.
   * @param args The command arguments to pass to the Git executable.
   * @return The command output as a string, or an Error if the command fails.
   */
  #executeGitCommand = async (args: string[]): Promise<string | Error> => {
    try {
      Logger.debug(`Executing git command: ${this.#gitExecutable} ${args.join(" ")} in ${this.path}`);

      const { stdout, stderr } = await execFileAsync(this.#gitExecutable, args, {
        cwd: this.path,
        encoding: "utf8",
        // Set a reasonable timeout to avoid hanging.
        timeout: 30_000,
      });

      if (stderr.trim()) {
        Logger.warn(`Git command produced stderr: ${stderr}`);
      }

      return stdout;
    } catch (error) {
      const message = `Git command failed: ${this.#gitExecutable} ${args.join(" ")}`;
      Logger.error(message, error);
      return new WrappedError(message, error);
    }
  };

  /**
   * {@inheritdoc ILocalGitRepository.workspaceFolder}
   */
  get workspaceFolder(): vscode.WorkspaceFolder {
    return this.#workspaceFolder;
  }

  /**
   * {@inheritdoc ILocalGitRepository.path}
   */
  get path(): string {
    return this.#workspaceFolder.uri.path;
  }

  /**
   * {@inheritdoc ILocalGitRepository.getFileAtCommit}
   */
  getFileAtCommit = async (treeish: string, filePath: string): Promise<string | Error> => {
    if (!treeish || !filePath) {
      return new Error("treeish and filePath are required");
    }

    // Validate commit SHA format (basic validation)
    if (!/^[a-f0-9]{7,40}$/i.test(treeish)) {
      return new Error(`Invalid commit SHA format: ${treeish}`);
    }

    // Normalize file path to use forward slashes for Git
    const normalizedPath = filePath.replace(/\\/g, "/");

    // Use git show command to get file contents at specific commit
    const result = await this.#executeGitCommand(["show", `${treeish}:${normalizedPath}`]);

    if (result instanceof Error) {
      return new WrappedError(`Failed to get file ${filePath} at commit ${treeish}`, result);
    }

    return result;
  };

  /**
   * {@inheritdoc ILocalGitRepository.getBranchCommitsAheadOf}
   */
  validateRepository = async (): Promise<boolean | Error> => {
    const result = await this.#executeGitCommand(["rev-parse", "--git-dir"]);
    return !(result instanceof Error);
  };

  /**
   * {@inheritdoc ILocalGitRepository.getFileAtCommit}
   */
  getCurrentCommit = async (): Promise<string | Error> => {
    const result = await this.#executeGitCommand(["rev-parse", "HEAD"]);
    if (result instanceof Error) {
      return result;
    }
    return result.trim();
  };

  /**
   * {@inheritdoc ILocalGitRepository.getCommitsForPullRequest}
   */
  getCommitsForPullRequest = async (pullRequestBaseBranch?: string, limit = 20): Promise<LocalCommit[] | Error> => {
    if (pullRequestBaseBranch === undefined) {
      // No pull request context, get all branch commits.
      return this.getBranchCommits(limit);
    }

    const targetBranch = `origin/${pullRequestBaseBranch}`;
    const commits = await this.getBranchCommitsAheadOf(targetBranch, limit);

    // Fall back to regular branch commits if the ahead-of method fails.
    if (commits instanceof Error) {
      Logger.debug(`Failed to get commits ahead of ${targetBranch}, falling back to all branch commits`, commits);
      return this.getBranchCommits(limit);
    }

    return commits;
  };

  /**
   * {@inheritdoc ILocalGitRepository.getCurrentCommit}
   */
  commitExists = async (treeish: string): Promise<boolean | Error> => {
    const result = await this.#executeGitCommand(["cat-file", "-e", treeish]);
    if (result instanceof Error) {
      // If the command fails, the commit doesn't exist
      return false;
    }

    return true;
  };

  /**
   * {@inheritdoc ILocalGitRepository.getCommitFiles}
   */
  getBranchCommitsAheadOf = async (targetBranch: string, limit = 50): Promise<LocalCommit[] | Error> => {
    if (!targetBranch) {
      return new Error("targetBranch is required");
    }

    // Use git log with range to get commits ahead of target branch
    const result = await this.#executeGitCommand([
      "log",
      "--oneline",
      "--format=%H|%s|%an|%ad",
      "--date=iso",
      `-${limit}`,
      `${targetBranch}..HEAD`,
    ]);

    if (result instanceof Error) {
      return new WrappedError(`Failed to get branch commits ahead of ${targetBranch}`, result);
    }

    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const commits: LocalCommit[] = [];

    for (const line of lines) {
      const parts = line.split("|");
      if (parts.length >= 4 && parts[0] && parts[1] && parts[2] && parts[3]) {
        commits.push({
          sha: parts[0],
          message: parts[1],
          author: parts[2],
          date: new Date(parts[3]),
        });
      }
    }

    return commits;
  };

  /**
   * {@inheritdoc ILocalGitRepository.getBranchCommits}
   */
  getBranchCommits = async (limit = 50): Promise<LocalCommit[] | Error> => {
    const result = await this.#executeGitCommand(["log", "--oneline", "--format=%H|%s|%an|%ad", "--date=iso", `-${limit}`]);

    if (result instanceof Error) {
      return new WrappedError("Failed to get branch commits", result);
    }

    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const commits: LocalCommit[] = [];

    for (const line of lines) {
      const parts = line.split("|");
      if (parts.length >= 4 && parts[0] && parts[1] && parts[2] && parts[3]) {
        commits.push({
          sha: parts[0],
          message: parts[1],
          author: parts[2],
          date: new Date(parts[3]),
        });
      }
    }

    return commits;
  };

  /**
   * {@inheritdoc ILocalGitRepository.getBranchStatus}
   */
  getBranchStatus = async (): Promise<BranchStatus | Error> => {
    // First get the current branch
    const currentBranch = await this.getCurrentBranch();
    if (currentBranch instanceof Error) {
      return currentBranch;
    }

    // Get the remote tracking branch
    const remoteResult = await this.#executeGitCommand(["rev-parse", "--abbrev-ref", `${currentBranch}@{upstream}`]);
    let remoteBranch: string | null = null;
    if (!(remoteResult instanceof Error)) {
      remoteBranch = remoteResult.trim();
    }

    // If no remote tracking branch, return clear indication
    if (!remoteBranch) {
      return {
        ahead: 0,
        behind: 0,
        remoteBranch: null,
      };
    }

    // Get ahead/behind counts
    const statusResult = await this.#executeGitCommand(["rev-list", "--left-right", "--count", `${remoteBranch}...HEAD`]);
    if (statusResult instanceof Error) {
      return new WrappedError("Failed to get branch status", statusResult);
    }

    const counts = statusResult.trim().split("\t");
    if (counts.length !== 2 || !counts[0] || !counts[1]) {
      return new Error("Unexpected git rev-list output format");
    }

    const behind = parseInt(counts[0], 10);
    const ahead = parseInt(counts[1], 10);

    if (isNaN(ahead) || isNaN(behind)) {
      return new Error("Invalid ahead/behind counts");
    }

    return {
      ahead,
      behind,
      remoteBranch,
    };
  };

  /**
   * {@inheritdoc ILocalGitRepository.getCurrentBranch}
   */
  getCurrentBranch = async (): Promise<string | Error> => {
    const result = await this.#executeGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
    if (result instanceof Error) {
      return new WrappedError("Failed to get current branch", result);
    }
    return result.trim();
  };

  /**
   * {@inheritdoc ILocalGitRepository.getCommitFiles}
   */
  getCommitFiles = async (treeish: string): Promise<LocalCommitFile[] | Error> => {
    if (!treeish) {
      return new Error("treeish is required");
    }

    // Validate commit SHA format (basic validation)
    if (!/^[a-f0-9]{7,40}$/i.test(treeish)) {
      return new Error(`Invalid commit SHA format: ${treeish}`);
    }

    // Use git diff-tree to get files changed in the commit
    const result = await this.#executeGitCommand(["diff-tree", "--no-commit-id", "--name-status", "-r", treeish]);

    if (result instanceof Error) {
      return new WrappedError(`Failed to get files for commit ${treeish}`, result);
    }

    const lines = result
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const files: LocalCommitFile[] = [];

    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const status = parts[0] as FileStatus;
        const filePath = parts[1];

        files.push({
          status,
          filePath,
        });
      }
    }

    return files;
  };

  /**
   * {@inheritdoc ILocalGitRepository.getParentCommit}
   */
  getParentCommit = async (treeish: string): Promise<string | Error> => {
    if (!treeish) {
      return new Error("treeish is required");
    }

    // Validate commit SHA format (basic validation)
    if (!/^[a-f0-9]{7,40}$/i.test(treeish)) {
      return new Error(`Invalid commit SHA format: ${treeish}`);
    }

    const result = await this.#executeGitCommand(["rev-parse", `${treeish}^`]);
    if (result instanceof Error) {
      return new WrappedError(`Failed to get parent commit for ${treeish}`, result);
    }

    return result.trim();
  };

  checkout = async (treeish: string): Promise<void | Error> => {
    try {
      await this.#gitExtensionRepository.checkout(treeish);
      return;
    } catch (error) {
      return new WrappedError(`Failed to checkout ${treeish}`, error);
    }
  };
}
