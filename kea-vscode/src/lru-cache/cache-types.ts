import { ILinkedListNode } from "./lru-linked-list";

export interface ICacheNode<T> {
  value: T;
}

export interface CacheResponseHeaders {
  etag: string | undefined;
  lastModified: string | undefined;
}

export interface ICacheValue<T> {
  headers: CacheResponseHeaders;
  data: T;
}

export interface IFullCacheValue<T> extends ICacheValue<T> {
  key: CacheKey;
  linkedListNode: ILinkedListNode;
}

const METHODS = ["GET", "POST"] as const;
export type Method = (typeof METHODS)[number];

export const isMethod = (method: string): method is Method => {
  return METHODS.includes(method as Method);
};

export type MethodCache = ICacheNode<Map<Method, IFullCacheValue<unknown>>>;
export type EndpointCache = ICacheNode<Map<string, MethodCache>>;
export type RepositoryCache = ICacheNode<Map<string, EndpointCache>>;
export type UserCache = ICacheNode<Map<string, RepositoryCache>>;

export type CacheKey = [user: string, repo: string, endpoint: string, method: Method];
