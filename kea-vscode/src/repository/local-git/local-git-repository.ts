import { execFile } from "child_process";
import { promisify } from "util";
import { IApiCache } from "../../cache/api/api-cache";
import { KeaDisposable } from "../../core/kea-disposable";
import { Logger } from "../../core/logger";
import { WrappedError } from "../../core/wrapped-error";

const execFileAsync = promisify(execFile);

export interface ILocalGitRepository {
  /**
   * Get the contents of a specific file at a given commit
   * @param commitSha The commit SHA to retrieve the file from
   * @param filePath The path to the file relative to the repository root
   * @returns The file contents as a string, or an Error if the operation fails
   */
  getFileAtCommit(commitSha: string, filePath: string): Promise<string | Error>;
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
  #detectGitExecutable(): string {
    // On Windows, Git might be in PATH as 'git' or 'git.exe'
    // On Unix-like systems, it's typically just 'git'
    return process.platform === "win32" ? "git.exe" : "git";
  }

  /**
   * Execute a Git command in the repository directory
   */
  async #executeGitCommand(args: string[]): Promise<string | Error> {
    try {
      Logger.debug(`Executing git command: ${this.#gitExecutable} ${args.join(" ")} in ${this.#repositoryPath}`);
      
      const { stdout, stderr } = await execFileAsync(this.#gitExecutable, args, {
        cwd: this.#repositoryPath,
        encoding: "utf8",
        // Set a reasonable timeout to avoid hanging
        timeout: 30000, // 30 seconds
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
  }

  /**
   * Get the contents of a specific file at a given commit
   */
  async getFileAtCommit(commitSha: string, filePath: string): Promise<string | Error> {
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
  }

  /**
   * Validate that the repository path contains a valid Git repository
   */
  async validateRepository(): Promise<boolean | Error> {
    const result = await this.#executeGitCommand(["rev-parse", "--git-dir"]);
    return !(result instanceof Error);
  }

  /**
   * Get the current HEAD commit SHA
   */
  async getCurrentCommit(): Promise<string | Error> {
    const result = await this.#executeGitCommand(["rev-parse", "HEAD"]);
    if (result instanceof Error) {
      return result;
    }
    return result.trim();
  }

  /**
   * Check if a commit exists in the repository
   */
  async commitExists(commitSha: string): Promise<boolean | Error> {
    const result = await this.#executeGitCommand(["cat-file", "-e", commitSha]);
    if (result instanceof Error) {
      // If the command fails, the commit doesn't exist
      return false;
    }
    return true;
  }
}