import * as assert from "assert";
import { ApiCache } from "./api-cache";
import { CacheKey, Method } from "./cache-types";

const createDefaultKey = (): CacheKey => ["user", "repo", "endpoint", "GET"];

// Helper to add data to cache with a full key
const setupCache = (
  apiCache: ApiCache,
  key: CacheKey,
  data = { test: "value" },
  headers = { etag: "etag123", lastModified: "2023-01-01" },
) => {
  return apiCache.set(key[0], key[1], key[2], key[3], data, headers);
};

suite("ApiCache", () => {
  suite("get", () => {
    test("should return undefined when the user is not in cache", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();

      // When
      const result = apiCache.get(key);

      // Then
      assert.strictEqual(result, undefined);
    });

    test("should return value when cache has been properly set", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();
      const data = { test: "value" };
      const headers = { etag: "etag123", lastModified: "2023-01-01" };

      // When
      setupCache(apiCache, key, data, headers);
      const result = apiCache.get(key);

      // Then
      if (result) {
        assert.deepStrictEqual(result.data, data);
        assert.deepStrictEqual(result.headers, headers);
        assert.deepStrictEqual(result.key, key);
      } else {
        assert.fail("Cache result should not be undefined");
      }
    });
  });

  suite("set", () => {
    test("should set a cache entry and return the linked list node", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();
      const data = { test: "value" };
      const headers = { etag: "etag123", lastModified: "2023-01-01" };

      // When
      const node = apiCache.set(key[0], key[1], key[2], key[3], data, headers);

      // Then
      assert.deepStrictEqual(node.key, key);
      const result = apiCache.get(key);
      if (result) {
        assert.deepStrictEqual(result.data, data);
        assert.deepStrictEqual(result.headers, headers);
      } else {
        assert.fail("Cache result should not be undefined");
      }
    });

    test("should overwrite existing cache entry", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();
      const initialData = { test: "initial" };
      const initialHeaders = { etag: "etag-initial", lastModified: "2023-01-01" };

      const updatedData = { test: "updated" };
      const updatedHeaders = { etag: "etag-updated", lastModified: "2023-01-02" };

      // Set initial cache
      apiCache.set(key[0], key[1], key[2], key[3], initialData, initialHeaders);

      // When - overwrite with updated data
      const node = apiCache.set(key[0], key[1], key[2], key[3], updatedData, updatedHeaders);

      // Then
      assert.deepStrictEqual(node.key, key);
      const result = apiCache.get(key);
      if (result) {
        assert.deepStrictEqual(result.data, updatedData);
        assert.deepStrictEqual(result.headers, updatedHeaders);
        assert.notDeepStrictEqual(result.data, initialData);
      } else {
        assert.fail("Cache result should not be undefined");
      }
    });
  });

  suite("invalidate", () => {
    test("should do nothing if user is not in cache", () => {
      // Given
      const apiCache = new ApiCache();
      const key: CacheKey = ["user1", "repo", "endpoint", "GET"];

      setupCache(apiCache, key);

      // When - try to invalidate a different user
      const result = apiCache.invalidate("user2");

      // Then - cache should remain intact and return an Error
      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, "User 'user2' not found in cache.");
      const cacheResult = apiCache.get(key);
      assert.notStrictEqual(cacheResult, undefined);
    });

    test("should delete user if repo is undefined", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();

      setupCache(apiCache, key);

      // When
      const result = apiCache.invalidate(key[0]);

      // Then
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
      const cacheResult = apiCache.get(key);
      assert.strictEqual(cacheResult, undefined);
    });

    test("should do nothing if repo is not in cache", () => {
      // Given
      const apiCache = new ApiCache();
      const key: CacheKey = ["user", "repo1", "endpoint", "GET"];

      setupCache(apiCache, key);

      // When - try to invalidate a different repo
      const result = apiCache.invalidate(key[0], "repo2");

      // Then - cache should remain intact and return an Error
      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, "Repository 'repo2' not found in cache.");
      const cacheResult = apiCache.get(key);
      assert.notStrictEqual(cacheResult, undefined);
    });

    test("should delete repo if endpoint is undefined", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();

      setupCache(apiCache, key);

      // When
      const result = apiCache.invalidate(key[0], key[1]);

      // Then
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.strictEqual(apiCache.get(key), undefined);
    });

    test("should do nothing if endpoint is not in cache", () => {
      // Given
      const apiCache = new ApiCache();
      const key: CacheKey = ["user", "repo", "endpoint1", "GET"];

      setupCache(apiCache, key);

      // When - try to invalidate a different endpoint
      const result = apiCache.invalidate(key[0], key[1], "endpoint2");

      // Then - cache should remain intact and return an Error
      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, "Endpoint 'endpoint2' not found in cache.");
      const cacheResult = apiCache.get(key);
      assert.notStrictEqual(cacheResult, undefined);
    });

    test("should delete endpoint if method is undefined", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();

      setupCache(apiCache, key);

      // When
      const result = apiCache.invalidate(key[0], key[1], key[2]);

      // Then
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.strictEqual(apiCache.get(key), undefined);
    });

    test("should do nothing if method is not in cache", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();

      setupCache(apiCache, key);

      // When - try to invalidate with an invalid method
      const result = apiCache.invalidate(key[0], key[1], key[2], "POST" as Method);

      // Then - cache should remain intact and return an Error
      assert.ok(result instanceof Error);
      assert.strictEqual(result.message, "Method 'POST' not found in cache.");
      const cacheResult = apiCache.get(key);
      assert.notStrictEqual(cacheResult, undefined);
    });

    test("should delete method cache entry for specific method", () => {
      // Given
      const apiCache = new ApiCache();
      const key = createDefaultKey();

      setupCache(apiCache, key);

      // When
      const result = apiCache.invalidate(...key);

      // Then
      assert.ok(Array.isArray(result));
      const nodes = result;
      assert.strictEqual(nodes.length, 1);

      // Always check the first node as we've asserted its existence above
      const node = nodes[0];
      if (node) {
        assert.deepStrictEqual(node.key, key);
      }

      // The specific method should be removed
      assert.strictEqual(apiCache.get(key), undefined);
    });
  });

  suite("clear", () => {
    test("should clear all cache entries", () => {
      // Given
      const apiCache = new ApiCache();
      const keys: CacheKey[] = [
        ["user1", "repo1", "endpoint1", "GET"],
        ["user1", "repo2", "endpoint1", "GET"],
        ["user2", "repo1", "endpoint1", "GET"],
      ];

      // Add multiple entries to cache
      keys.forEach((key) => {
        setupCache(apiCache, key);
      });

      // Verify entries are in cache
      keys.forEach((key) => {
        assert.notStrictEqual(apiCache.get(key), undefined);
      });

      // When
      apiCache.clear();

      // Then
      keys.forEach((key) => {
        assert.strictEqual(apiCache.get(key), undefined);
      });
    });
  });
});
