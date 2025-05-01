import * as vscode from "vscode";
import { KeaDisposable } from "../../core/kea-disposable";
import { Logger } from "../../core/logger";
import { WrappedError } from "../../core/wrapped-error";
import { RepoId } from "../../types/kea";
import { CacheResponseHeaders, ICacheValue, IFullCacheValue } from "../common/common-api-types";
import { ILinkedListNode, LinkedList } from "../common/linked-list";

interface NodeKey {
  /**
   * The ID of the repository.
   */
  repoId: RepoId;

  /**
   * The file ID - either a commit hash + path, or a blob URL.
   */
  fileId: string;
}

type FileCacheValue = ICacheValue<vscode.Uri>;
type FileCacheFullValue = IFullCacheValue<NodeKey, vscode.Uri>;

export interface IFileCache {
  /**
   * Gets the URI and headers of the file from the cache.
   * @param repoId The ID of the repository.
   * @param fileId The file ID - either a commit hash + path, or a blob URL.
   * @returns The URI and headers of the file, or undefined if not found.
   */
  get: (repoId: RepoId, fileId: string) => Promise<FileCacheValue | Error>;

  /**
   * Caches the file data and the headers for the given blob URL.
   * @param repoId The ID of the repository.
   * @param fileId The file ID - either a commit hash + path, or a blob URL.
   * @param data The file data to cache.
   * @param headers The headers to cache.
   * @returns The URI of the cached file, or an error if the operation fails.
   */
  set: (repoId: RepoId, fileId: string, data: string, headers: CacheResponseHeaders) => Promise<vscode.Uri | Error>;

  /**
   * Invalidates the cache for the given repository ID and file ID.
   * @param repoId The ID of the repository.
   * @param fileId The file ID. If not provided, all files for the repository will be invalidated.
   * @returns A promise that resolves when the cache is invalidated.
   */
  invalidate: (repoId: RepoId, fileId?: string) => Promise<void>;

  /**
   * Clears the entire cache.
   * @returns A promise that resolves when the cache is cleared.
   */
  clear: () => Promise<void>;
}

type BlobFilenameMap = Map<string, FileCacheFullValue>;

/**
 * A cache implementation for file blobs.
 */
export class FileCache extends KeaDisposable implements IFileCache {
  readonly #repoMap = new Map<string, BlobFilenameMap>();
  readonly #linkedList = new LinkedList<NodeKey>();
  readonly #tempDir;
  readonly #fileSystem: vscode.FileSystem;

  #size = 0;
  maxSize: number;

  get size(): number {
    return this.#size;
  }

  constructor(extCtx: vscode.ExtensionContext, maxSize: number, fileSystem: vscode.FileSystem = vscode.workspace.fs) {
    super();
    this.maxSize = maxSize;
    this.#fileSystem = fileSystem;
    this.#tempDir = vscode.Uri.joinPath(extCtx.globalStorageUri, "file-cache");
  }

  protected override _dispose = async () => {
    await this.clear();
  };

  #createRepoKey = (repoId: RepoId): string => `${repoId.owner}/${repoId.repo}`;

  #createRepoUri = (repoId: RepoId): vscode.Uri => vscode.Uri.joinPath(this.#tempDir, repoId.owner, repoId.repo);

  #createFileUri = (repoId: RepoId, fileId: string): vscode.Uri => vscode.Uri.joinPath(this.#createRepoUri(repoId), fileId);

  get = async (repoId: RepoId, fileId: string): Promise<FileCacheValue | Error> => {
    const repoKey = this.#createRepoKey(repoId);
    const blobFilenameMap = this.#repoMap.get(repoKey);
    if (blobFilenameMap === undefined) {
      return new Error("Repository not found in cache");
    }

    const cacheResult = blobFilenameMap.get(fileId);
    if (cacheResult === undefined) {
      return new Error("File not found in cache");
    }

    this.#linkedList.demote(cacheResult.linkedListNode);

    const fileUri = cacheResult.data;

    try {
      const fileStat = await this.#fileSystem.stat(fileUri);
      if (fileStat.type !== vscode.FileType.File) {
        return new Error(`Expected a file, received ${fileStat.type}`);
      }

      return {
        headers: cacheResult.headers,
        data: fileUri,
      };
    } catch (error) {
      Logger.error("Error reading file", error);
    }

    return {
      headers: cacheResult.headers,
      data: cacheResult.data,
    };
  };

  set = async (repoId: RepoId, fileId: string, data: string, headers: CacheResponseHeaders): Promise<vscode.Uri | Error> => {
    const repoKey = this.#createRepoKey(repoId);
    const nodeKey = { repoId, fileId };

    const linkedListNode: ILinkedListNode<NodeKey> = {
      key: nodeKey,
      next: null,
      prev: null,
    };
    const fileUri = this.#createFileUri(repoId, fileId);

    this.#linkedList.add(linkedListNode);

    const cacheValue: FileCacheFullValue = {
      key: nodeKey,
      data: fileUri,
      headers,
      linkedListNode,
    };

    const blobFilenameMap = this.#repoMap.get(repoKey) ?? new Map<string, FileCacheFullValue>();
    blobFilenameMap.set(fileId, cacheValue);

    this.#repoMap.set(repoKey, blobFilenameMap);

    try {
      await this.#fileSystem.createDirectory(this.#tempDir);
      await this.#fileSystem.writeFile(fileUri, Buffer.from(data));
      Logger.info("File written", fileUri);
    } catch (error) {
      Logger.error("Error writing file", error);
      this.#linkedList.remove(linkedListNode);
      return error instanceof Error ? error : new WrappedError("Error writing file", error);
    }

    this.#size += 1;
    await this.#evict();

    return fileUri;
  };

  #evict = async (): Promise<void> => {
    if (this.size <= this.maxSize) {
      return;
    }

    const evictedKey = this.#linkedList.removeOldest();
    if (evictedKey === undefined) {
      return;
    }

    await this.invalidate(evictedKey.repoId, evictedKey.fileId);
  };

  invalidate = async (repoId: RepoId, fileId?: string): Promise<void> => {
    if (fileId === undefined) {
      await this.#removeRepoFiles(repoId);
      return;
    }

    await this.#removeFile(repoId, fileId);
  };

  #removeRepoFiles = async (repoId: RepoId): Promise<void> => {
    const repoKey = this.#createRepoKey(repoId);
    const blobFilenameMap = this.#repoMap.get(repoKey);
    if (blobFilenameMap === undefined) {
      return;
    }

    try {
      await this.#fileSystem.delete(this.#createRepoUri(repoId), { recursive: true, useTrash: false });
    } catch (error) {
      Logger.error("Error deleting directory", error);
    }

    this.#repoMap.delete(repoKey);
    this.#size -= blobFilenameMap.size;
  };

  #removeFile = async (repoId: RepoId, fileId: string): Promise<void> => {
    const repoKey = this.#createRepoKey(repoId);
    const blobFilenameMap = this.#repoMap.get(repoKey);
    if (blobFilenameMap === undefined) {
      return;
    }

    const cacheValue = blobFilenameMap.get(fileId);
    if (cacheValue === undefined) {
      return;
    }

    this.#linkedList.remove(cacheValue.linkedListNode);
    blobFilenameMap.delete(fileId);

    try {
      await this.#fileSystem.delete(cacheValue.data, { recursive: false, useTrash: true });
      Logger.info("Deleted file", cacheValue.data);
    } catch (error) {
      Logger.error("Error deleting file", error);
    }

    this.#size -= 1;
  };

  clear = async (): Promise<void> => {
    this.#repoMap.clear();
    this.#linkedList.clear();
    this.#size = 0;

    try {
      await this.#fileSystem.delete(this.#tempDir, { recursive: true, useTrash: false });
    } catch (error) {
      Logger.error("Error clearing file cache", error);
    }
  };
}
