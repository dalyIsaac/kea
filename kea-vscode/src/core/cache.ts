import { LRUCache } from "lru-cache";

interface CacheResponseHeaders {
  etag: string | undefined;
  lastModified: string | undefined;
}

interface CacheEntry<T> {
  headers: CacheResponseHeaders;
  data: T;
}

type Params = Record<string, unknown> | undefined;

export interface ICache {
  generateKey: (route: string, params?: Params) => string;
  get: (key: string) => unknown;
  getHeaders: (key: string) => CacheResponseHeaders | undefined;
  set: (key: string, data: unknown, headers: CacheResponseHeaders) => void;
}

export class Cache implements ICache {
  #cache: LRUCache<string, CacheEntry<unknown>>;

  constructor() {
    this.#cache = new LRUCache<string, CacheEntry<unknown>>({
      max: 1000,
    });
  }

  generateKey = (route: string, params?: Params): string => {
    if (params === undefined) {
      return route;
    }
    return `${route}=${JSON.stringify(params)}`;
  };

  get = (key: string): unknown => {
    const entry = this.#cache.get(key);
    return entry ? entry.data : undefined;
  };

  getHeaders = (key: string): CacheResponseHeaders | undefined => {
    const entry = this.#cache.get(key);
    return entry ? entry.headers : undefined;
  };

  set = (key: string, data: unknown, headers: CacheResponseHeaders): void => {
    this.#cache.set(key, { headers, data });
  };
}
