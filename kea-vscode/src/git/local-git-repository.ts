import { execFile } from "child_process";
import { promisify } from "util";
import { IApiCache } from "../cache/api/api-cache";
import { KeaDisposable } from "../core/kea-disposable";
import { Logger } from "../core/logger";
import { WrappedError } from "../core/wrapped-error";

const execFileAsync = promisify(execFile);

export interface BranchStatus {
  ahead: number;
  behind: number;
  remoteBranch: string | null;
}

export interface LocalCommit {
  sha: string;
  message: string;
  author: string;
  date: Date;
}

export interface LocalCommitFile {
  filename: string;
  status: "A" | "M" | "D" | "R" | "C"; // Added, Modified, Deleted, Renamed, Copied
}

export interface ILocalGitRepository {
  /**
   * Get the contents of a specific file at a given commit.
   * @param commitSha The commit SHA to retrieve the file from.
   * @param filePath The path to the file relative to the repository root.
   * @returns The file contents as a string, or an Error if the operation fails.
   */
  getFileAtCommit(commitSha: string, filePath: string): Promise<string | Error>;

  /**
   * Get commits from the current branch that are ahead of the target branch.
   * @param targetBranch The target branch to compare against (e.g., 'main', 'origin/main').
   * @param limit Maximum number of commits to retrieve (default: 50).
   * @returns Array of commits from the current branch that are ahead of the target branch.
   */
  getBranchCommitsAheadOf(targetBranch: string, limit = 50): Promise<LocalCommit[] | Error>;

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
   * Get files changed in a specific commit.
   * @param commitSha The commit SHA to get files for.
   * @returns Array of files changed in the commit.
   */
  getCommitFiles(commitSha: string): Promise<LocalCommitFile[] | Error>;

  /**
   * Get the parent commit SHA for a given commit.
   * @param commitSha The commit SHA to get the parent for.
   * @returns The parent commit SHA, or an Error if the operation fails.
   */
  getParentCommit(commitSha: string): Promise<string | Error>;
}

/**
 * LocalGitRepository provides access to a Git repository through direct Git command execution.
 * This allows for operations that don't require GitHub API access.
 */
export class LocalGitRepository extends KeaDisposable implements ILocalGitRepository {
  #repositoryPath: string;
  #gitExecutable: string;

  constructor(repositoryPath: string, _cache: IApiCache) {
    super();
    this.#repositoryPath = repositoryPath;
    this.#gitExecutable = this.#detectGitExecutable();
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
   * Execute a Git command in the repository directory
   */
  #executeGitCommand = async (args: string[]): Promise<string | Error> => {
    try {
      Logger.debug(`Executing git command: ${this.#gitExecutable} ${args.join(" ")} in ${this.#repositoryPath}`);

      const { stdout, stderr } = await execFileAsync(this.#gitExecutable, args, {
        cwd: this.#repositoryPath,
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
   * Get the contents of a specific file at a given commit.
   */
  getFileAtCommit = async (commitSha: string, filePath: string): Promise<string | Error> => {
    if (!commitSha || !filePath) {
      return new Error("commitSha and filePath are required");
    }

    // Validate commit SHA format (basic validation)
    if (!/^[a-f0-9]{7,40}$/i.test(commitSha)) {
      return new Error(`Invalid commit SHA format: ${commitSha}`);
    }

    // Normalize file path to use forward slashes for Git
    const normalizedPath = filePath.replace(/\\/g, "/");

    // Use git show command to get file contents at specific commit
    const result = await this.#executeGitCommand(["show", `${commitSha}:${normalizedPath}`]);

    if (result instanceof Error) {
      return new WrappedError(`Failed to get file ${filePath} at commit ${commitSha}`, result);
    }

    return result;
  };

  /**
   * Validate that the repository path contains a valid Git repository.
   */
  validateRepository = async (): Promise<boolean | Error> => {
    const result = await this.#executeGitCommand(["rev-parse", "--git-dir"]);
    return !(result instanceof Error);
  };

  /**
   * Get the current HEAD commit SHA.
   */
  getCurrentCommit = async (): Promise<string | Error> => {
    const result = await this.#executeGitCommand(["rev-parse", "HEAD"]);
    if (result instanceof Error) {
      return result;
    }
    return result.trim();
  };

  /**
   * Check if a commit exists in the repository.
   */
  commitExists = async (commitSha: string): Promise<boolean | Error> => {
    const result = await this.#executeGitCommand(["cat-file", "-e", commitSha]);
    if (result instanceof Error) {
      // If the command fails, the commit doesn't exist
      return false;
    }
    return true;
  };

  /**
   * Get commits from the current branch that are ahead of the target branch.
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

    const lines = result.trim().split("\n").filter((line) => line.trim());
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
   * Get commits from the current branch.
   */
  getBranchCommits = async (limit = 50): Promise<LocalCommit[] | Error> => {
    const result = await this.#executeGitCommand([
      "log",
      "--oneline",
      "--format=%H|%s|%an|%ad",
      "--date=iso",
      `-${limit}`,
    ]);

    if (result instanceof Error) {
      return new WrappedError("Failed to get branch commits", result);
    }

    const lines = result.trim().split("\n").filter((line) => line.trim());
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
   * Get the ahead/behind status compared to the remote tracking branch.
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

    // If no remote tracking branch, return zeros
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
   * Get the current branch name.
   */
  getCurrentBranch = async (): Promise<string | Error> => {
    const result = await this.#executeGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
    if (result instanceof Error) {
      return new WrappedError("Failed to get current branch", result);
    }
    return result.trim();
  };

  /**
   * Get files changed in a specific commit.
   */
  getCommitFiles = async (commitSha: string): Promise<LocalCommitFile[] | Error> => {
    if (!commitSha) {
      return new Error("commitSha is required");
    }

    // Validate commit SHA format (basic validation)
    if (!/^[a-f0-9]{7,40}$/i.test(commitSha)) {
      return new Error(`Invalid commit SHA format: ${commitSha}`);
    }

    // Use git diff-tree to get files changed in the commit
    const result = await this.#executeGitCommand([
      "diff-tree",
      "--no-commit-id",
      "--name-status",
      "-r",
      commitSha
    ]);

    if (result instanceof Error) {
      return new WrappedError(`Failed to get files for commit ${commitSha}`, result);
    }

    const lines = result.trim().split("\n").filter((line) => line.trim());
    const files: LocalCommitFile[] = [];

    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const status = parts[0] as "A" | "M" | "D" | "R" | "C";
        const filename = parts[1];
        
        files.push({
          status,
          filename,
        });
      }
    }

    return files;
  };

  /**
   * Get the parent commit SHA for a given commit.
   * @param commitSha The commit SHA to get the parent for.
   * @returns The parent commit SHA, or an Error if the operation fails.
   */
  getParentCommit = async (commitSha: string): Promise<string | Error> => {
    if (!commitSha) {
      return new Error("commitSha is required");
    }

    // Validate commit SHA format (basic validation)
    if (!/^[a-f0-9]{7,40}$/i.test(commitSha)) {
      return new Error(`Invalid commit SHA format: ${commitSha}`);
    }

    const result = await this.#executeGitCommand(["rev-parse", `${commitSha}^`]);
    if (result instanceof Error) {
      return new WrappedError(`Failed to get parent commit for ${commitSha}`, result);
    }

    return result.trim();
  };
}
