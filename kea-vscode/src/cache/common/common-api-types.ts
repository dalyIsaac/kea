import { ILinkedListNode } from "./linked-list";

export interface CacheResponseHeaders {
  etag: string | undefined;
  lastModified: string | undefined;
}

export interface ICacheValue<T> {
  headers: CacheResponseHeaders;
  data: T;
}

export interface IFullCacheValue<TKey, TData> extends ICacheValue<TData> {
  key: TKey;
  linkedListNode: ILinkedListNode<TKey>;
}
