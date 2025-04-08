interface ICacheNode<T> {
  value: T;
}

interface ICacheNodeValue<T> {
  key: CacheKey;
  value: T;
  linkedListNode: ILinkedListNode;
}

type Method = "GET" | "POST";

type MethodCache = ICacheNode<Map<Method, ICacheNodeValue<unknown>>>;
type EndpointCache = ICacheNode<Map<string, MethodCache>>;
type RepositoryCache = ICacheNode<Map<string, EndpointCache>>;
type UserCache = ICacheNode<Map<string, RepositoryCache>>;

type CacheKey = [user: string, repo: string, endpoint: string, method: Method];

interface ILinkedListNode {
  prev: ILinkedListNode | null;
  next: ILinkedListNode | null;
  key: CacheKey;
}

class LinkedList {
  #head: ILinkedListNode | null = null;
  #tail: ILinkedListNode | null = null;

  add = (key: CacheKey): ILinkedListNode => {
    const newNode: ILinkedListNode = {
      prev: this.#tail,
      next: null,
      key,
    };

    if (this.#head === null) {
      this.#head = newNode;
    }

    if (this.#tail !== null) {
      this.#tail.next = newNode;
    }
    this.#tail = newNode;
    return newNode;
  };

  pop = (): CacheKey | undefined => {
    if (this.#tail === null) {
      return;
    }

    const poppedNode = this.#tail;
    if (this.#tail.prev === null) {
      this.#head = null;
      this.#tail = null;
      return poppedNode.key;
    }

    this.#tail = poppedNode.prev;
    if (this.#tail !== null) {
      this.#tail.next = null;
    }

    return poppedNode.key;
  };

  promote = (node: ILinkedListNode): void => {
    const parentNode = node.prev;
    const grandParentNode = parentNode?.prev ?? null;
    const nextNode = node.next;

    // [grandParentNode, parentNode, node, nextNode] becomes
    // [grandParentNode, node, parentNode, nextNode]

    if (grandParentNode === null) {
      this.#head = node;
    } else {
      grandParentNode.next = node;
    }

    if (parentNode !== null) {
      parentNode.next = nextNode;
    }

    if (nextNode !== null) {
      nextNode.prev = parentNode;
    }
  };
}

type GetCacheResult =
  | undefined
  | {
      userCache: UserCache;
      repoCache?: RepositoryCache;
      endpointCache?: EndpointCache;
      methodCache?: MethodCache;
      value?: unknown;
      linkedListNode?: ILinkedListNode;
    };

class Cache {
  #cache = new Map<string, UserCache>();

  get = (...[user, repo, endpoint, method]: CacheKey): GetCacheResult => {
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

class LRUCache {
  readonly #cache = new Cache();
  readonly #linkedList = new LinkedList();

  maxSize: number;

  #size = 0;
  get size(): number {
    return this.#size;
  }

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get = (...key: CacheKey): unknown => this.#cache.get(...key)?.value;

  set = (user: string, repo: string, endpoint: string, method: Method, value: unknown): void => {
    const cacheResult = this.#cache.get(user, repo, endpoint, method);

    const key: CacheKey = [user, repo, endpoint, method];
    let userCache: UserCache | undefined;
    let repoCache: RepositoryCache | undefined;
    let endpointCache: EndpointCache | undefined;
    let methodCache: MethodCache | undefined;
    let linkedListNode: ILinkedListNode | undefined;

    if (cacheResult === undefined) {
      this.#evict();

      // Preemptively increment the size for the new cache entry.
      this.#size += 1;
    } else {
      ({ userCache, repoCache, endpointCache, methodCache, linkedListNode } = cacheResult);
    }

    if (userCache === undefined) {
      userCache = { value: new Map() };
    }
    this.#cache.set(user, userCache);

    if (repoCache === undefined) {
      repoCache = { value: new Map() };
    }
    userCache.value.set(repo, repoCache);

    if (endpointCache === undefined) {
      endpointCache = { value: new Map() };
    }
    repoCache.value.set(endpoint, endpointCache);

    if (methodCache === undefined || linkedListNode === undefined) {
      methodCache = { value: new Map() };
      linkedListNode = this.#linkedList.add(key);
    } else {
      this.#linkedList.promote(linkedListNode);
    }

    endpointCache.value.set(method, methodCache);
    methodCache.value.set(method, { key, value, linkedListNode });
  };

  #evict = (): void => {
    if (this.#size < this.maxSize) {
      return;
    }

    const evictedKey = this.#linkedList.pop();
    if (evictedKey === undefined) {
      return;
    }

    const [user, repo, endpoint, method] = evictedKey;
    const cacheResult = this.#cache.get(user, repo, endpoint, method);
    if (cacheResult === undefined) {
      return;
    }

    const { userCache, repoCache, endpointCache, methodCache } = cacheResult;
    methodCache?.value.delete(method);
    endpointCache?.value.delete(endpoint);
    repoCache?.value.delete(repo);
    userCache.value.delete(user);
    this.#size -= 1;
  };
}
