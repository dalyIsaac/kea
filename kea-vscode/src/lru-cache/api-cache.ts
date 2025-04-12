import { CacheKey, EndpointCache, IFullCacheValue, MethodCache, RepositoryCache, UserCache } from "./cache-types";

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

  invalidate = (...[user, repo, endpoint, method]: Partial<CacheKey>): void => {
    if (user === undefined) {
      return;
    }

    const userCache = this.#cache.get(user);
    if (userCache === undefined) {
      return;
    }

    if (repo === undefined) {
      this.#cache.delete(user);
      return;
    }

    const repoCache = userCache.value.get(repo);
    if (repoCache === undefined) {
      return;
    }

    if (endpoint === undefined) {
      userCache.value.delete(repo);
      return;
    }

    const endpointCache = repoCache.value.get(endpoint);
    if (endpointCache === undefined) {
      return;
    }

    if (method === undefined) {
      repoCache.value.delete(endpoint);
      return;
    }

    const methodCache = endpointCache.value.get(method);
    if (methodCache === undefined) {
      return;
    }

    methodCache.value.delete(method);
  };
}
