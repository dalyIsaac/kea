import { CacheKey, EndpointCache, ILinkedListNode, MethodCache, RepositoryCache, UserCache } from "./linked-list";

export interface ICacheNode<T> {
  value: T;
}

export interface ICacheNodeValue<T> {
  key: CacheKey;
  value: T;
  linkedListNode: ILinkedListNode;
}

type GetInnerCacheResult =
  | undefined
  | {
      userCache: UserCache;
      repoCache?: RepositoryCache;
      endpointCache?: EndpointCache;
      methodCache?: MethodCache;
      value?: unknown;
      linkedListNode?: ILinkedListNode;
    };

export class InnerCache {
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

    return {
      userCache: userCache,
      repoCache: repoCache,
      endpointCache: endpointCache,
      methodCache: cacheMethod,
      value: cacheMethod.value,
    };
  };

  set = (user: string, cacheUser: UserCache): void => {
    this.#cache.set(user, cacheUser);
  };
}
