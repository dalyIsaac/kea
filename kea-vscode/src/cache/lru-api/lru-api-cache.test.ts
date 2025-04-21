import * as assert from "assert";
import { CacheKey, CacheResponseHeaders, Method } from "./cache-types";
import { LruApiCache } from "./lru-api-cache";

const createHeaders = (etag = "etag123", lastModified = "2023-01-01"): CacheResponseHeaders => ({
  etag,
  lastModified,
});

const createCacheKey = (id: string, method: Method = "GET"): CacheKey => ["user1", "repo1", `endpoint-${id}`, method];

suite("LruApiCache", () => {
  suite("Constructor", () => {
    test("should initialize with the correct maxSize", () => {
      // Given
      const maxSize = 10;

      // When
      const cache = new LruApiCache(maxSize);

      // Then
      assert.strictEqual(cache.maxSize, maxSize);
      assert.strictEqual(cache.size, 0);
    });
  });

  suite("get", () => {
    test("should return undefined for non-existent cache key", () => {
      // Given
      const cache = new LruApiCache(10);
      const key = createCacheKey("1");

      // When
      const result = cache.get(...key);

      // Then
      assert.strictEqual(result, undefined);
    });

    test("should return cached value after setting", () => {
      // Given
      const cache = new LruApiCache(10);
      const [user, repo, endpoint, method] = createCacheKey("1");
      const data = { foo: "bar" };
      const headers = createHeaders();

      // When
      cache.set(user, repo, endpoint, method, data, headers);
      const result = cache.get(user, repo, endpoint, method);

      // Then
      assert.deepStrictEqual(result, {
        headers,
        data,
      });
    });
  });

  suite("set", () => {
    test("should increase cache size when adding new items", () => {
      // Given
      const cache = new LruApiCache(10);
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const data = { test: "data" };
      const headers = createHeaders();

      // When
      cache.set(...key1, data, headers);

      // Then
      assert.strictEqual(cache.size, 1);

      // When add another item
      cache.set(...key2, data, headers);

      // Then
      assert.strictEqual(cache.size, 2);
    });

    test("should not increase size when updating existing item", () => {
      // Given
      const cache = new LruApiCache(10);
      const [user, repo, endpoint, method] = createCacheKey("1");
      const initialData = { test: "initial" };
      const updatedData = { test: "updated" };
      const headers = createHeaders();

      // When
      cache.set(user, repo, endpoint, method, initialData, headers);
      assert.strictEqual(cache.size, 1);

      // Update the same item
      cache.set(user, repo, endpoint, method, updatedData, headers);

      // Then
      assert.strictEqual(cache.size, 1);
      const result = cache.get(user, repo, endpoint, method);
      assert.deepStrictEqual(result?.data, updatedData);
    });

    test("should store items with different methods separately", () => {
      // Given
      const cache = new LruApiCache(10);
      const key1 = ["user1", "repo1", "endpoint1", "GET"] as CacheKey;
      const key2 = ["user1", "repo1", "endpoint1", "POST"] as CacheKey;
      const getData = { method: "GET" };
      const postData = { method: "POST" };
      const headers = createHeaders();

      // When
      cache.set(...key1, getData, headers);
      cache.set(...key2, postData, headers);

      // Then
      assert.strictEqual(cache.size, 2);
      assert.deepStrictEqual(cache.get(...key1)?.data, getData);
      assert.deepStrictEqual(cache.get(...key2)?.data, postData);
    });
  });

  suite("eviction", () => {
    test("should evict least recently used item when cache is full", () => {
      // Given
      const maxSize = 3;
      const cache = new LruApiCache(maxSize);
      const headers = createHeaders();

      // Add maxSize items to fill the cache
      for (let idx = 1; idx <= maxSize; idx += 1) {
        const key = createCacheKey(idx.toString());
        cache.set(...key, { id: idx }, headers);
      }

      // When - add one more item to trigger eviction
      const newKey = createCacheKey((maxSize + 1).toString());
      cache.set(...newKey, { id: maxSize + 1 }, headers);

      // Then - first item should be evicted, cache size should remain maxSize
      assert.strictEqual(cache.size, maxSize);
      assert.strictEqual(cache.get(...createCacheKey("1")), undefined);
      assert.notStrictEqual(cache.get(...newKey), undefined);
    });

    test("should not evict when accessing items (get doesn't trigger eviction)", () => {
      // Given
      const cache = new LruApiCache(3);
      const headers = createHeaders();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      // Fill cache
      cache.set(...key1, { id: 1 }, headers);
      cache.set(...key2, { id: 2 }, headers);
      cache.set(...key3, { id: 3 }, headers);

      // When - access the first item (the least recently used)
      cache.get(...key1);

      // Add a new item to trigger eviction
      const key4 = createCacheKey("4");
      cache.set(...key4, { id: 4 }, headers);

      // Then - key2 should be evicted as it's at the head of the list (oldest).
      // This is because the get causes the key1 to be promoted.
      assert.notStrictEqual(cache.get(...key1), undefined);
      assert.strictEqual(cache.get(...key2), undefined);
      assert.notStrictEqual(cache.get(...key3), undefined);
      assert.notStrictEqual(cache.get(...key4), undefined);
    });

    test("should promote items when accessed with set", () => {
      // Given
      const cache = new LruApiCache(3);
      const headers = createHeaders();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");
      const key3 = createCacheKey("3");

      // Fill cache
      cache.set(...key1, { id: 1 }, headers);
      cache.set(...key2, { id: 2 }, headers);
      cache.set(...key3, { id: 3 }, headers);

      // When - update the first item (the oldest)
      cache.set(...key1, { id: "updated" }, headers);

      // Add a new item to trigger eviction
      const key4 = createCacheKey("4");
      cache.set(...key4, { id: 4 }, headers);

      // Then - key2 should be evicted since key1 was promoted
      assert.notStrictEqual(cache.get(...key1), undefined);
      assert.strictEqual(cache.get(...key2), undefined);
      assert.notStrictEqual(cache.get(...key3), undefined);
      assert.notStrictEqual(cache.get(...key4), undefined);
    });
  });

  suite("invalidate", () => {
    test("should invalidate specific cache entry", () => {
      // Given
      const cache = new LruApiCache(10);
      const headers = createHeaders();
      const key1 = createCacheKey("1");
      const key2 = createCacheKey("2");

      cache.set(...key1, { id: 1 }, headers);
      cache.set(...key2, { id: 2 }, headers);

      // When
      cache.invalidate(...key1);

      // Then
      const item1 = cache.get(...key1);
      const item2 = cache.get(...key2);
      assert.strictEqual(item1, undefined);
      assert.notStrictEqual(item2, undefined);
      assert.strictEqual(cache.size, 1);
    });

    test("should invalidate entries by user", () => {
      // Given
      const cache = new LruApiCache(10);
      const headers = createHeaders();
      const key1 = ["user1", "repo1", "endpoint1", "GET"] as CacheKey;
      const key2 = ["user2", "repo1", "endpoint1", "GET"] as CacheKey;

      cache.set(...key1, { id: 1 }, headers);
      cache.set(...key2, { id: 2 }, headers);

      // When
      cache.invalidate("user1");

      // Then
      const item1 = cache.get(...key1);
      const item2 = cache.get(...key2);
      assert.strictEqual(item1, undefined);
      assert.notStrictEqual(item2, undefined);
      assert.strictEqual(cache.size, 1);
    });

    test("should invalidate entries by user and repo", () => {
      // Given
      const cache = new LruApiCache(10);
      const headers = createHeaders();
      const key1 = ["user1", "repo1", "endpoint1", "GET"] as CacheKey;
      const key2 = ["user1", "repo2", "endpoint1", "GET"] as CacheKey;

      cache.set(...key1, { id: 1 }, headers);
      cache.set(...key2, { id: 2 }, headers);

      // When
      cache.invalidate("user1", "repo1");

      // Then
      const item1 = cache.get(...key1);
      const item2 = cache.get(...key2);
      assert.strictEqual(item1, undefined);
      assert.notStrictEqual(item2, undefined);
      assert.strictEqual(cache.size, 1);
    });

    test("should invalidate entries by user, repo, and endpoint", () => {
      // Given
      const cache = new LruApiCache(10);
      const headers = createHeaders();
      const key1 = ["user1", "repo1", "endpoint1", "GET"] as CacheKey;
      const key2 = ["user1", "repo1", "endpoint2", "GET"] as CacheKey;

      cache.set(...key1, { id: 1 }, headers);
      cache.set(...key2, { id: 2 }, headers);

      // When
      cache.invalidate("user1", "repo1", "endpoint1");

      // Then
      const item1 = cache.get(...key1);
      const item2 = cache.get(...key2);
      assert.strictEqual(item1, undefined);
      assert.notStrictEqual(item2, undefined);
      assert.strictEqual(cache.size, 1);
    });
  });

  suite("clear", () => {
    test("should remove all cache entries", () => {
      // Given
      const cache = new LruApiCache(10);
      const headers = createHeaders();

      for (let i = 1; i <= 5; i += 1) {
        const key = createCacheKey(i.toString());
        cache.set(...key, { id: i }, headers);
      }

      assert.strictEqual(cache.size, 5);

      // When
      cache.clear();

      // Then
      assert.strictEqual(cache.size, 0);

      for (let i = 1; i <= 5; i += 1) {
        const key = createCacheKey(i.toString());
        assert.strictEqual(cache.get(...key), undefined);
      }
    });
  });

  suite("complex scenario", () => {
    test("should handle a mix of operations correctly", () => {
      // Given
      const cache = new LruApiCache(4);
      const headers = createHeaders();

      // Add initial items
      for (let i = 1; i <= 3; i += 1) {
        const key = createCacheKey(i.toString());
        cache.set(...key, { id: i }, headers);
      }

      // Verify initial state
      assert.strictEqual(cache.size, 3);

      // Access the first item to promote it in the LRU list
      const key1 = createCacheKey("1");
      assert.deepStrictEqual(cache.get(...key1)?.data, { id: 1 });

      // Add a new item to fill the cache (shouldn't cause eviction yet)
      const key4 = createCacheKey("4");
      cache.set(...key4, { id: 4 }, headers);
      assert.strictEqual(cache.size, 4);

      // All items should still be present
      for (let i = 1; i <= 4; i += 1) {
        const key = createCacheKey(i.toString());
        assert.notStrictEqual(cache.get(...key), undefined);
      }

      // Update an existing item
      cache.set(...key1, { id: "updated" }, headers);
      assert.strictEqual(cache.size, 4);
      assert.deepStrictEqual(cache.get(...key1)?.data, { id: "updated" });

      // Add a new item to force eviction
      const key5 = createCacheKey("5");
      cache.set(...key5, { id: 5 }, headers);

      // The second item should have been evicted (it's now the least recently used)
      const key2 = createCacheKey("2");
      assert.strictEqual(cache.get(...key2), undefined);
      assert.strictEqual(cache.size, 4);

      // Clear the cache
      cache.clear();
      assert.strictEqual(cache.size, 0);
    });
  });
});
