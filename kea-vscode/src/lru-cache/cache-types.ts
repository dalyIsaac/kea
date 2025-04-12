import { ILinkedListNode } from "./lru-linked-list";

export interface ICacheNode<T> {
  value: T;
}

export interface CacheResponseHeaders {
  etag: string | undefined;
  lastModified: string | undefined;
}

export interface ICacheValue<T> {
  key: CacheKey;
  headers: CacheResponseHeaders;
  data: T;
  linkedListNode: ILinkedListNode;
}

export type Method = "GET" | "POST";
export type MethodCache = ICacheNode<Map<Method, ICacheValue<unknown>>>;
export type EndpointCache = ICacheNode<Map<string, MethodCache>>;
export type RepositoryCache = ICacheNode<Map<string, EndpointCache>>;
export type UserCache = ICacheNode<Map<string, RepositoryCache>>;

export type CacheKey = [user: string, repo: string, endpoint: string, method: Method];
