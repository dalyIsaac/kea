import crypto from "crypto";
import * as vscode from "vscode";
import { KeaDisposable } from "../../core/kea-disposable";
import { Logger } from "../../core/logger";
import { CacheResponseHeaders, ICacheValue, IFullCacheValue } from "../common/common-api-types";
import { ILinkedListNode, LinkedList } from "../common/linked-list";

type FileCacheValue = ICacheValue<vscode.Uri>;
type FileCacheFullValue = IFullCacheValue<string, vscode.Uri>;

export interface IFileCache {
  /**
   * Gets the URI and headers of the file from the cache.
   * @param blobUrl The URL of the file to cache.
   * @returns The URI and headers of the file, or undefined if not found.
   */
  get: (blobUrl: string) => Promise<FileCacheValue | undefined>;

  /**
   * Caches the file data and the headers for the given blob URL.
   * This will evict the oldest file if the cache size exceeds the maximum size.
   * @param blobUrl The URL of the file to cache.
   * @param data The file data to cache.
   * @param headers The headers to cache.
   * @returns A promise that resolves when the file is cached.
   */
  set: (blobUrl: string, data: string, headers: CacheResponseHeaders) => Promise<void>;

  /**
   * Invalidates the cache for the given blob URL.
   * @param blobUrl The URL of the file to invalidate.
   * @returns A promise that resolves when the cache is invalidated.
   */
  invalidate: (blobUrl: string) => Promise<void>;

  /**
   * Clears the entire cache.
   * @returns A promise that resolves when the cache is cleared.
   */
  clear: () => Promise<void>;
}

/**
 * A cache implementation for file blobs.
 */
export class FileCache extends KeaDisposable implements IFileCache {
  readonly #blobFilenameMap = new Map<string, FileCacheFullValue>();
  readonly #linkedList = new LinkedList<string>();
  readonly #tempDir;
  readonly #fileSystem: vscode.FileSystem;

  maxSize: number;

  get size(): number {
    return this.#blobFilenameMap.size;
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

  #createFileUri = (url: string): vscode.Uri => {
    const hash = crypto.createHash("sha256").update(url).digest("hex");
    return vscode.Uri.joinPath(this.#tempDir, hash);
  };

  get = async (blobUrl: string): Promise<FileCacheValue | undefined> => {
    const cacheResult = this.#blobFilenameMap.get(blobUrl);
    if (cacheResult === undefined) {
      return undefined;
    }

    this.#linkedList.demote(cacheResult.linkedListNode);

    const fileUri = cacheResult.data;

    try {
      const fileStat = await this.#fileSystem.stat(fileUri);
      if (fileStat.type !== vscode.FileType.File) {
        Logger.error("File is not a file", fileUri);
        return undefined;
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

  set = async (blobUrl: string, data: string, headers: CacheResponseHeaders): Promise<void> => {
    const linkedListNode: ILinkedListNode<string> = { key: blobUrl, next: null, prev: null };
    const fileUri = this.#createFileUri(blobUrl);

    this.#linkedList.add(linkedListNode);

    this.#blobFilenameMap.set(blobUrl, { key: blobUrl, data: fileUri, headers, linkedListNode });

    try {
      await this.#fileSystem.createDirectory(this.#tempDir);
      await this.#fileSystem.writeFile(fileUri, Buffer.from(data));
      Logger.info("File written", fileUri);
    } catch (error) {
      Logger.error("Error writing file", error);
    }

    await this.#evict();
  };

  #evict = async (): Promise<void> => {
    if (this.size <= this.maxSize) {
      return;
    }

    const evictedKey = this.#linkedList.removeOldest();
    if (evictedKey === undefined) {
      return;
    }

    await this.invalidate(evictedKey);
  };

  invalidate = async (blobUrl: string): Promise<void> => {
    const cacheValue = this.#blobFilenameMap.get(blobUrl);
    if (cacheValue === undefined) {
      return;
    }

    this.#linkedList.remove(cacheValue.linkedListNode);
    this.#blobFilenameMap.delete(blobUrl);

    try {
      const fileUri = cacheValue.data;
      await this.#fileSystem.delete(fileUri, { recursive: false, useTrash: true });
      Logger.info("Deleted file", fileUri);
    } catch (error) {
      Logger.error("Error deleting file", error);
    }
  };

  clear = async (): Promise<void> => {
    this.#blobFilenameMap.clear();
    this.#linkedList.clear();

    try {
      await this.#fileSystem.delete(this.#tempDir, { recursive: true, useTrash: false });
    } catch (error) {
      Logger.error("Error clearing file cache", error);
    }
  };
}
