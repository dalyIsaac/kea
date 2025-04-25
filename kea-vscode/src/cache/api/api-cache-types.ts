import { ILinkedListNode } from "../common/linked-list";

export type ICacheLevel<TKey, TValue> = Map<TKey, TValue>;

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
  linkedListNode: ILinkedListNode<CacheKey>;
}

const METHODS = ["GET", "POST"] as const;
export type Method = (typeof METHODS)[number];

export const isMethod = (method: string): method is Method => {
  return METHODS.includes(method as Method);
};

export type MethodValueMap = ICacheLevel<Method, IFullCacheValue<unknown>>;
export type EndpointMethodMap = ICacheLevel<string, MethodValueMap>;
export type RepoEndpointMap = ICacheLevel<string, EndpointMethodMap>;
export type UserRepoMap = ICacheLevel<string, RepoEndpointMap>;

export type CacheKey = [user: string, repo: string, endpoint: string, method: Method];
