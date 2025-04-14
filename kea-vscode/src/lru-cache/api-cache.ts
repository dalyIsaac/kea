import { Logger } from "../core/logger";
import {
  CacheKey,
  CacheResponseHeaders,
  EndpointMethodMap,
  IFullCacheValue,
  Method,
  MethodValueMap,
  RepoEndpointMap,
  UserRepoMap,
} from "./cache-types";
import { ILinkedListNode } from "./linked-list";

interface GetInnerCacheSuccess {
  userRepoMap: UserRepoMap;
  repoEndpointMap?: RepoEndpointMap;
  endpointMethodMap?: EndpointMethodMap;
  methodValueMap?: MethodValueMap;
  cacheValue?: IFullCacheValue<unknown>;
}

type GetInnerCacheResult = undefined | GetInnerCacheSuccess;

export class ApiCache {
  #cache = new Map<string, UserRepoMap>();
  #size = 0;

  get size(): number {
    return this.#size;
  }

  get = (key: CacheKey): IFullCacheValue<unknown> | undefined => this.#get(...key)?.cacheValue;

  #get = (...[user, repo, endpoint, method]: CacheKey): GetInnerCacheResult => {
    const userRepoMap = this.#cache.get(user);
    if (userRepoMap === undefined) {
      return undefined;
    }

    const repoEndpointMap = userRepoMap.get(repo);
    if (repoEndpointMap === undefined) {
      return { userRepoMap: userRepoMap };
    }

    const endpointMethodMap = repoEndpointMap.get(endpoint);
    if (endpointMethodMap === undefined) {
      return { userRepoMap: userRepoMap, repoEndpointMap: repoEndpointMap };
    }

    const methodValueMap = endpointMethodMap.get(method);
    if (methodValueMap === undefined) {
      return { userRepoMap: userRepoMap, repoEndpointMap: repoEndpointMap, endpointMethodMap: endpointMethodMap };
    }

    const cacheValue = methodValueMap.get(method);
    if (cacheValue === undefined) {
      return { userRepoMap: userRepoMap, repoEndpointMap: repoEndpointMap, endpointMethodMap: endpointMethodMap };
    }

    return {
      userRepoMap: userRepoMap,
      repoEndpointMap: repoEndpointMap,
      endpointMethodMap: endpointMethodMap,
      methodValueMap: methodValueMap,
      cacheValue: cacheValue,
    };
  };

  set = (user: string, repo: string, endpoint: string, method: Method, data: unknown, headers: CacheResponseHeaders): ILinkedListNode => {
    const cacheResult = this.#get(user, repo, endpoint, method);

    const key: CacheKey = [user, repo, endpoint, method];
    let userRepoMap: UserRepoMap | undefined;
    let repoEndpointMap: RepoEndpointMap | undefined;
    let endpointMethodMap: EndpointMethodMap | undefined;
    let methodValueMap: MethodValueMap | undefined;
    let linkedListNode: ILinkedListNode | undefined;

    if (cacheResult !== undefined) {
      ({ userRepoMap, repoEndpointMap, endpointMethodMap, methodValueMap } = cacheResult);
      linkedListNode = cacheResult.cacheValue?.linkedListNode;
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
      linkedListNode = { key, next: null, prev: null };
      this.#size += 1;
    }

    endpointMethodMap.set(method, methodValueMap);
    methodValueMap.set(method, { key, data, headers, linkedListNode });

    return linkedListNode;
  };

  invalidate = (user: string, repo?: string, endpoint?: string, method?: Method): ILinkedListNode[] | Error => {
    const userRepoMap = this.#cache.get(user);
    if (userRepoMap === undefined) {
      return new Error(`User '${user}' not found in cache.`);
    }
    if (repo === undefined) {
      // Invalidate the entire user.
      const invalidatedNodes: ILinkedListNode[] = [];
      this.#invalidateUser(userRepoMap, invalidatedNodes);
      this.#cache.delete(user);
      this.#size -= invalidatedNodes.length;
      return invalidatedNodes;
    }

    const repoEndpointMap = userRepoMap.get(repo);
    if (repoEndpointMap === undefined) {
      return new Error(`Repository '${repo}' not found in cache.`);
    }
    if (endpoint === undefined) {
      // Invalidate the entire repository.
      const invalidatedNodes: ILinkedListNode[] = [];
      this.#invalidateRepo(repoEndpointMap, invalidatedNodes);
      this.#deleteFromMap([user, repo], [this.#cache, userRepoMap]);
      this.#size -= invalidatedNodes.length;
      return invalidatedNodes;
    }

    const endpointMethodMap = repoEndpointMap.get(endpoint);
    if (endpointMethodMap === undefined) {
      return new Error(`Endpoint '${endpoint}' not found in cache.`);
    }
    if (method === undefined) {
      // Invalidate the entire endpoint.
      const invalidatedNodes: ILinkedListNode[] = [];
      this.#invalidateEndpoint(endpointMethodMap, invalidatedNodes);
      this.#deleteFromMap([user, repo, endpoint], [this.#cache, userRepoMap, repoEndpointMap]);
      this.#size -= invalidatedNodes.length;
      return invalidatedNodes;
    }

    const methodValueMap = endpointMethodMap.get(method);
    if (methodValueMap === undefined) {
      return new Error(`Method '${method}' not found in cache.`);
    }

    // Invalidate the specific method.
    const invalidatedNodes: ILinkedListNode[] = [];
    const cacheValue = methodValueMap.get(method);
    if (cacheValue === undefined) {
      return new Error(`Cache value for method '${method}' not found.`);
    }

    invalidatedNodes.push(cacheValue.linkedListNode);
    this.#deleteFromMap([user, repo, endpoint, method], [this.#cache, userRepoMap, repoEndpointMap, endpointMethodMap]);
    this.#size -= invalidatedNodes.length;
    return invalidatedNodes;
  };

  #deleteFromMap = (keys: string[], maps: Array<Map<string, unknown>>): void => {
    if (keys.length !== maps.length) {
      Logger.error("Keys and maps length mismatch", { keys, maps });
      return;
    }

    for (let idx = keys.length - 1; idx >= 0; idx--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const key = keys[idx]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const map = maps[idx]!;

      map.delete(key);

      if (map.size !== 0) {
        break;
      }
    }
  };

  #invalidateUser = (userRepoMap: UserRepoMap, invalidatedNodes: ILinkedListNode[]): void => {
    for (const repoEndpointMap of userRepoMap.values()) {
      this.#invalidateRepo(repoEndpointMap, invalidatedNodes);
    }
  };

  #invalidateRepo = (repoEndpointMap: RepoEndpointMap, invalidatedNodes: ILinkedListNode[]): void => {
    for (const endpointMethodMap of repoEndpointMap.values()) {
      this.#invalidateEndpoint(endpointMethodMap, invalidatedNodes);
    }
  };

  #invalidateEndpoint = (endpointMethodMap: EndpointMethodMap, invalidatedNodes: ILinkedListNode[]): void => {
    for (const methodValueMap of endpointMethodMap.values()) {
      for (const cacheValue of methodValueMap.values()) {
        invalidatedNodes.push(cacheValue.linkedListNode);
      }
    }
  };

  clear = (): void => {
    this.#cache.clear();
  };
}
