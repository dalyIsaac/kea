import { ApiCache } from "./api-cache";
import {
  CacheKey,
  CacheResponseHeaders,
  EndpointMethodMap,
  ICacheValue,
  Method,
  MethodValueMap,
  RepoEndpointMap,
  UserRepoMap,
} from "./cache-types";
import { ILinkedListNode, LinkedList } from "./linked-list";

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

    this.#linkedList.demote(cacheResult.value.linkedListNode);

    return {
      headers: cacheResult.value.headers,
      data: cacheResult.value.data,
    };
  };

  set = (user: string, repo: string, endpoint: string, method: Method, data: unknown, headers: CacheResponseHeaders): void => {
    const cacheResult = this.#cache.get(user, repo, endpoint, method);

    const key: CacheKey = [user, repo, endpoint, method];
    let userRepoMap: UserRepoMap | undefined;
    let repoEndpointMap: RepoEndpointMap | undefined;
    let endpointMethodMap: EndpointMethodMap | undefined;
    let methodValueMap: MethodValueMap | undefined;
    let linkedListNode: ILinkedListNode | undefined;

    if (cacheResult !== undefined) {
      ({ userRepoMap, repoEndpointMap, endpointMethodMap, methodValueMap } = cacheResult);
      linkedListNode = cacheResult.value?.linkedListNode;
    }

    if (userRepoMap === undefined) {
      userRepoMap = new Map();
    }
    this.#cache.set(user, userRepoMap);

    if (repoEndpointMap === undefined) {
      repoEndpointMap = new Map();
    }
    userRepoMap.set(repo, repoEndpointMap);

    if (endpointMethodMap === undefined) {
      endpointMethodMap = new Map();
    }
    repoEndpointMap.set(endpoint, endpointMethodMap);

    if (methodValueMap === undefined || linkedListNode === undefined) {
      methodValueMap = new Map();
      linkedListNode = this.#linkedList.add(key);
      this.#size += 1;
    } else {
      this.#linkedList.demote(linkedListNode);
    }

    endpointMethodMap.set(method, methodValueMap);
    methodValueMap.set(method, { key, data, headers, linkedListNode });

    this.#evict();
  };

  #evict = (): void => {
    if (this.#size <= this.maxSize) {
      return;
    }

    const evictedKey = this.#linkedList.removeOldest();
    if (evictedKey === undefined) {
      return;
    }

    const [user, repo, endpoint, method] = evictedKey;
    const cacheResult = this.#cache.get(user, repo, endpoint, method);
    if (cacheResult === undefined) {
      return;
    }

    const { userRepoMap, repoEndpointMap, endpointMethodMap, methodValueMap } = cacheResult;
    methodValueMap?.delete(method);
    endpointMethodMap?.delete(endpoint);
    repoEndpointMap?.delete(repo);
    userRepoMap.delete(user);
    this.#size -= 1;
  };

  invalidate = (user: string, repo?: string, endpoint?: string, method?: Method): void => {
    const nodesToDelete = this.#cache.invalidate(user, repo, endpoint, method);
    if (nodesToDelete instanceof Error) {
      console.error(nodesToDelete.message);
      return;
    }

    for (const node of nodesToDelete) {
      this.#linkedList.removeNode(node);
      this.#size -= 1;
    }
  };

  clear = (): void => {
    this.#cache.clear();
    this.#linkedList.clear();
    this.#size = 0;
  };
}
