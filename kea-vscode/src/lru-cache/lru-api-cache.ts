import { ApiCache } from "./api-cache";
import { CacheKey, CacheResponseHeaders, ICacheValue, Method } from "./cache-types";
import { LinkedList } from "./linked-list";

export interface ILruApiCache {
  get: (...key: CacheKey) => ICacheValue<unknown> | undefined;
  set: (user: string, repo: string, endpoint: string, method: Method, data: unknown, headers: CacheResponseHeaders) => void;
  invalidate: (user: string, repo?: string, endpoint?: string, method?: Method) => void;
  clear: () => void;
}

export class LruApiCache implements ILruApiCache {
  readonly #cache = new ApiCache();
  readonly #linkedList = new LinkedList();

  maxSize: number;

  get size(): number {
    return this.#cache.size;
  }

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get = (...key: CacheKey): ICacheValue<unknown> | undefined => {
    const cacheResult = this.#cache.get(key);
    if (cacheResult === undefined) {
      return undefined;
    }

    this.#linkedList.demote(cacheResult.linkedListNode);

    return {
      headers: cacheResult.headers,
      data: cacheResult.data,
    };
  };

  set = (user: string, repo: string, endpoint: string, method: Method, data: unknown, headers: CacheResponseHeaders): void => {
    const linkedListNode = this.#cache.set(user, repo, endpoint, method, data, headers);
    this.#linkedList.demote(linkedListNode);
    this.#evict();
  };

  #evict = (): void => {
    if (this.size <= this.maxSize) {
      return;
    }

    const evictedKey = this.#linkedList.removeOldest();
    if (evictedKey === undefined) {
      return;
    }

    this.invalidate(...evictedKey);
  };

  invalidate = (user: string, repo?: string, endpoint?: string, method?: Method): void => {
    const nodesToDelete = this.#cache.invalidate(user, repo, endpoint, method);
    if (nodesToDelete instanceof Error) {
      console.error(nodesToDelete.message);
      return;
    }

    for (const node of nodesToDelete) {
      this.#linkedList.removeNode(node);
    }
  };

  clear = (): void => {
    this.#cache.clear();
    this.#linkedList.clear();
  };
}
