import { ICacheNode, ICacheNodeValue } from "./api-cache";

export type Method = "GET" | "POST";
export type MethodCache = ICacheNode<Map<Method, ICacheNodeValue<unknown>>>;
export type EndpointCache = ICacheNode<Map<string, MethodCache>>;
export type RepositoryCache = ICacheNode<Map<string, EndpointCache>>;
export type UserCache = ICacheNode<Map<string, RepositoryCache>>;

export type CacheKey = [user: string, repo: string, endpoint: string, method: Method];
