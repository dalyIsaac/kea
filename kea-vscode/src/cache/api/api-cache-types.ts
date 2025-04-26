import { ICacheValue, IFullCacheValue } from "../common/common-api-types";

export type ICacheLevel<TKey, TValue> = Map<TKey, TValue>;

const METHODS = ["GET", "POST"] as const;
export type Method = (typeof METHODS)[number];

export const isMethod = (method: string): method is Method => {
  return METHODS.includes(method as Method);
};

export type MethodValueMap = ICacheLevel<Method, IFullCacheValue<CacheKey, unknown>>;
export type EndpointMethodMap = ICacheLevel<string, MethodValueMap>;
export type RepoEndpointMap = ICacheLevel<string, EndpointMethodMap>;
export type UserRepoMap = ICacheLevel<string, RepoEndpointMap>;

export type CacheKey = [user: string, repo: string, endpoint: string, method: Method];

export type ApiCacheValue = ICacheValue<unknown>;
export type ApiCacheFullValue = IFullCacheValue<CacheKey, unknown>;
