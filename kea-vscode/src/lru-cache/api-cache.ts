import { CacheKey, EndpointCache, IFullCacheValue, Method, MethodCache, RepositoryCache, UserCache } from "./cache-types";
import { ILinkedListNode } from "./linked-list";

interface GetInnerCacheSuccess {
  userCache: UserCache;
  repoCache?: RepositoryCache;
  endpointCache?: EndpointCache;
  methodCache?: MethodCache;
  value?: IFullCacheValue<unknown>;
}

type GetInnerCacheResult = undefined | GetInnerCacheSuccess;

export class ApiCache {
  #cache = new Map<string, UserCache>();

  get = (...[user, repo, endpoint, method]: CacheKey): GetInnerCacheResult => {
    const userCache = this.#cache.get(user);
    if (userCache === undefined) {
      return undefined;
    }

    const repoCache = userCache.value.get(repo);
    if (repoCache === undefined) {
      return { userCache };
    }

    const endpointCache = repoCache.value.get(endpoint);
    if (endpointCache === undefined) {
      return { userCache, repoCache };
    }

    const cacheMethod = endpointCache.value.get(method);
    if (cacheMethod === undefined) {
      return { userCache, repoCache, endpointCache };
    }

    const cacheValue = cacheMethod.value.get(method);
    if (cacheValue === undefined) {
      return { userCache, repoCache, endpointCache };
    }

    return {
      userCache: userCache,
      repoCache: repoCache,
      endpointCache: endpointCache,
      methodCache: cacheMethod,
      value: cacheValue,
    };
  };

  set = (user: string, cacheUser: UserCache): void => {
    this.#cache.set(user, cacheUser);
  };

  invalidate = (...[user, repo, endpoint, method]: Partial<CacheKey>): ILinkedListNode[] | Error => {
    // Wiping the entire cache if the key is empty is an invalid operation - use the `clear` method instead.
    if (user === undefined) {
      return [];
    }

    const userCache = this.#cache.get(user);
    if (userCache === undefined) {
      return new Error(`User must be defined`);
    }

    // Invalidate the entire user cache if the repo is not defined.
    if (repo === undefined) {
      const userNodes = this.#getUserNodes(userCache, user);
      userCache.value.delete(user);
      return userNodes;
    }

    const repoCache = userCache.value.get(repo);
    if (repoCache === undefined) {
      return new Error(`Repo cache not found for ${user}/${repo}`);
    }
    if (endpoint === undefined) {
      const repoNodes = this.#getRepoNodes(repoCache, repo);
      repoCache.value.delete(repo);
      return repoNodes;
    }

    const endpointCache = repoCache.value.get(endpoint);
    if (endpointCache === undefined) {
      return new Error(`Endpoint cache not found for ${user}/${repo}/${endpoint}`);
    }
    if (method === undefined) {
      const endpointNodes = this.#getEndpointNodes(endpointCache, endpoint);
      endpointCache.value.delete(endpoint);
      return endpointNodes;
    }

    // Invalid method.
    const methodCache = endpointCache.value.get(method);
    if (methodCache === undefined) {
      return new Error(`Method cache not found for ${user}/${repo}/${endpoint}/${method}`);
    }

    // Invalidating the specific method cache.
    const methodNode = this.#getMethodNode(methodCache, method);
    methodCache.value.delete(method);
    return methodNode ? [methodNode] : [];
  };

  #getUserNodes = (userCache: UserCache, user: string): ILinkedListNode[] => {
    const repoCache = userCache.value.get(user);
    if (repoCache === undefined) {
      return [];
    }

    const nodes: ILinkedListNode[] = [];
    for (const repo of repoCache.value.keys()) {
      this.#getRepoNodes(repoCache, repo, nodes);
    }
    return nodes;
  };

  #getRepoNodes = (repoCache: RepositoryCache, repo: string, nodes: ILinkedListNode[] = []): ILinkedListNode[] => {
    const endpointCache = repoCache.value.get(repo);
    if (endpointCache === undefined) {
      return [];
    }

    for (const endpoint of endpointCache.value.keys()) {
      this.#getEndpointNodes(endpointCache, endpoint, nodes);
    }

    return nodes;
  };

  #getEndpointNodes = (endpointCache: EndpointCache, endpoint: string, nodes: ILinkedListNode[] = []): ILinkedListNode[] => {
    const methodCache = endpointCache.value.get(endpoint);
    if (methodCache === undefined) {
      return [];
    }

    for (const method of methodCache.value.keys()) {
      const value = this.#getMethodNode(methodCache, method);
      if (value !== undefined) {
        nodes.push(value);
      }
    }

    return nodes;
  };

  #getMethodNode = (methodCache: MethodCache, method: Method): ILinkedListNode | undefined => {
    const cacheValue = methodCache.value.get(method);
    if (cacheValue === undefined) {
      return undefined;
    }
    return cacheValue.linkedListNode;
  };

  clear = (): void => {
    this.#cache.clear();
  };
}
