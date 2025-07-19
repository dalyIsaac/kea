/**
 * Example integration of LocalGitRepository with Kea's existing architecture
 * 
 * This demonstrates how LocalGitRepository could be integrated alongside
 * the existing GitHubRepository for a hybrid approach.
 */

import * as vscode from "vscode";
import { IApiCache } from "../../cache/api/api-cache";
import { Logger } from "../../core/logger";
import { LocalGitRepository } from "./local-git-repository";

/**
 * Example service that combines GitHub API and local Git access
 */
export class HybridGitService {
  #localRepo: LocalGitRepository | undefined;
  #workspaceFolder: vscode.WorkspaceFolder;
  #cache: IApiCache;

  constructor(workspaceFolder: vscode.WorkspaceFolder, cache: IApiCache) {
    this.#workspaceFolder = workspaceFolder;
    this.#cache = cache;
  }

  /**
   * Initialize local Git repository if available
   */
  async initialize(): Promise<boolean> {
    try {
      this.#localRepo = new LocalGitRepository(this.#workspaceFolder.uri.fsPath, this.#cache);
      
      const isValid = await this.#localRepo.validateRepository();
      if (isValid === true) {
        Logger.info(`Initialized local Git repository for ${this.#workspaceFolder.name}`);
        return true;
      } else {
        await this.#localRepo.dispose();
        this.#localRepo = undefined;
        Logger.warn(`Invalid Git repository at ${this.#workspaceFolder.uri.fsPath}`);
        return false;
      }
    } catch (error) {
      Logger.error("Failed to initialize local Git repository", error);
      if (this.#localRepo) {
        await this.#localRepo.dispose();
        this.#localRepo = undefined;
      }
      return false;
    }
  }

  /**
   * Get file content at a specific commit, preferring local Git when available
   */
  async getFileAtCommit(commitSha: string, filePath: string): Promise<string | Error> {
    if (this.#localRepo) {
      Logger.debug(`Getting file ${filePath} at ${commitSha} from local Git`);
      return this.#localRepo.getFileAtCommit(commitSha, filePath);
    }
    
    // Fallback to GitHub API or other methods
    return new Error("Local Git repository not available and no fallback configured");
  }

  /**
   * Get current commit from local repository
   */
  async getCurrentCommit(): Promise<string | Error> {
    if (this.#localRepo) {
      return this.#localRepo.getCurrentCommit();
    }
    
    return new Error("Local Git repository not available");
  }

  /**
   * Check if a commit exists locally
   */
  async hasCommit(commitSha: string): Promise<boolean> {
    if (!this.#localRepo) {
      return false;
    }
    
    const result = await this.#localRepo.commitExists(commitSha);
    return result === true;
  }

  /**
   * Get local repository status
   */
  get hasLocalRepo(): boolean {
    return this.#localRepo !== undefined;
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (this.#localRepo) {
      await this.#localRepo.dispose();
      this.#localRepo = undefined;
    }
  }
}

/**
 * Example usage in a VS Code command
 */
export async function getFileFromLocalGit(
  workspaceFolder: vscode.WorkspaceFolder,
  commitSha: string,
  filePath: string,
  cache: IApiCache
): Promise<string | Error> {
  const service = new HybridGitService(workspaceFolder, cache);
  
  try {
    const initialized = await service.initialize();
    if (!initialized) {
      return new Error("Could not initialize local Git repository");
    }
    
    const fileContent = await service.getFileAtCommit(commitSha, filePath);
    return fileContent;
  } finally {
    await service.dispose();
  }
}