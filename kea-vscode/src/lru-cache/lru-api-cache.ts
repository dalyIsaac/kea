import { ApiCache } from "./api-cache";
import { CacheKey, CacheResponseHeaders, EndpointCache, ICacheValue, Method, MethodCache, RepositoryCache, UserCache } from "./cache-types";
import { ILinkedListNode, LinkedList } from "./lru-linked-list";

export interface ILruApiCache {
  get: (...key: CacheKey) => ICacheValue<unknown> | undefined;
  set: (user: string, repo: string, endpoint: string, method: Method, data: unknown, headers: CacheResponseHeaders) => void;
}

export class LruApiCache implements ILruApiCache {
  readonly #cache = new ApiCache();
  readonly #linkedList = new LinkedList();

  maxSize: number;

  #size = 0;
  get size(): number {
    return this.#size;
  }

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get = (...key: CacheKey): ICacheValue<unknown> | undefined => {
    const cacheResult = this.#cache.get(...key);
    if (cacheResult?.value === undefined) {
      return undefined;
    }

    return {
      headers: cacheResult.value.headers,
      data: cacheResult.value.data,
    };
  };

  set = (user: string, repo: string, endpoint: string, method: Method, data: unknown, headers: CacheResponseHeaders): void => {
    const cacheResult = this.#cache.get(user, repo, endpoint, method);

    const key: CacheKey = [user, repo, endpoint, method];
    let userCache: UserCache | undefined;
    let repoCache: RepositoryCache | undefined;
    let endpointCache: EndpointCache | undefined;
    let methodCache: MethodCache | undefined;
    let linkedListNode: ILinkedListNode | undefined;

    if (cacheResult === undefined) {
      this.#evict();

      // Preemptively increment the size for the new cache entry.
      this.#size += 1;
    } else {
      ({ userCache, repoCache, endpointCache, methodCache } = cacheResult);
      linkedListNode = cacheResult.value?.linkedListNode;
    }

    if (userCache === undefined) {
      userCache = { value: new Map() };
    }
    this.#cache.set(user, userCache);

    if (repoCache === undefined) {
      repoCache = { value: new Map() };
    }
    userCache.value.set(repo, repoCache);

    if (endpointCache === undefined) {
      endpointCache = { value: new Map() };
    }
    repoCache.value.set(endpoint, endpointCache);

    if (methodCache === undefined || linkedListNode === undefined) {
      methodCache = { value: new Map() };
      linkedListNode = this.#linkedList.add(key);
    } else {
      this.#linkedList.promote(linkedListNode);
    }

    endpointCache.value.set(method, methodCache);
    methodCache.value.set(method, { key, data, headers, linkedListNode });
  };

  #evict = (): void => {
    if (this.#size < this.maxSize) {
      return;
    }

    const evictedKey = this.#linkedList.pop();
    if (evictedKey === undefined) {
      return;
    }

    const [user, repo, endpoint, method] = evictedKey;
    const cacheResult = this.#cache.get(user, repo, endpoint, method);
    if (cacheResult === undefined) {
      return;
    }

    const { userCache, repoCache, endpointCache, methodCache } = cacheResult;
    methodCache?.value.delete(method);
    endpointCache?.value.delete(endpoint);
    repoCache?.value.delete(repo);
    userCache.value.delete(user);
    this.#size -= 1;
  };

  invalidate = (...key: Partial<CacheKey>): void => {
    this.#cache.invalidate(...key);
  };
}
