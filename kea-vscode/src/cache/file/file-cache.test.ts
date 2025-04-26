/* eslint-disable */
import * as assert from "assert";
import crypto from "crypto";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { CacheResponseHeaders } from "../common/common-api-types";
import { FileCache } from "./file-cache";

suite("FileCache", () => {
  let sandbox: sinon.SinonSandbox;
  let extCtx: Partial<vscode.ExtensionContext>;
  let headers: CacheResponseHeaders;
  let fakeFs: Partial<vscode.FileSystem>;

  setup(() => {
    sandbox = sinon.createSandbox();
    // Create fake FileSystem with stubbed methods
    fakeFs = {
      stat: sandbox.stub().resolves({ type: vscode.FileType.File } as any),
      createDirectory: sandbox.stub().resolves(),
      writeFile: sandbox.stub().resolves(),
      delete: sandbox.stub().resolves(),
    };

    // Minimal extension context stub
    extCtx = { globalStorageUri: vscode.Uri.parse("file:///test-storage") };

    headers = { etag: "etag123", lastModified: "2023-01-01" };
  });

  teardown(() => {
    sandbox.restore();
  });

  test("the constructor should initialize with correct maxSize and zero size", () => {
    // Given
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    // When
    // Then
    assert.strictEqual(cache.maxSize, 5);
    assert.strictEqual(cache.size, 0);
  });

  test("get should return undefined when cache key is not set", async () => {
    // Given
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    // When
    const result = await cache.get("url1");
    // Then
    assert.strictEqual(result, undefined);
  });

  test("set should store file and headers correctly", async () => {
    // Given
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    const url = "http://example.com/blob";
    const data = "file-content";
    // When
    await cache.set(url, data, headers);
    // Then
    assert.strictEqual(cache.size, 1);
    const result = await cache.get(url);
    assert.ok(result);
    assert.deepStrictEqual(result!.headers, headers);
    assert.ok(result!.data instanceof vscode.Uri);
    // And the URI matches the hash of the URL
    const hash = crypto.createHash("sha256").update(url).digest("hex");
    const expectedUri = vscode.Uri.joinPath(extCtx!.globalStorageUri!, "file-cache", hash);
    assert.strictEqual(result!.data.toString(), expectedUri.toString());
  });

  test("should evict least recently used entry when exceeding maxSize", async () => {
    // Given
    const cache = new FileCache(extCtx as any, 2, fakeFs as any);
    await cache.set("u1", "d1", headers);
    await cache.set("u2", "d2", headers);
    // When
    await cache.set("u3", "d3", headers);
    // Then
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(await cache.get("u1"), undefined);
    assert.ok(await cache.get("u2"));
    assert.ok(await cache.get("u3"));
  });

  test("invalidate should remove specific entry", async () => {
    // Given
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    await cache.set("u1", "d1", headers);
    await cache.set("u2", "d2", headers);
    // When
    await cache.invalidate("u1");
    // Then
    assert.strictEqual(cache.size, 1);
    assert.strictEqual(await cache.get("u1"), undefined);
    assert.ok(await cache.get("u2"));
  });

  test("clear should remove all entries", async () => {
    // Given
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    await cache.set("u1", "d1", headers);
    await cache.set("u2", "d2", headers);
    // When
    await cache.clear();
    // Then
    assert.strictEqual(cache.size, 0);
    assert.strictEqual(await cache.get("u1"), undefined);
    assert.strictEqual(await cache.get("u2"), undefined);
  });

  test("get should return undefined when file is a directory", async () => {
    // Given
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    const url = "dir-url";
    (fakeFs.stat as sinon.SinonStub).resolves({ type: vscode.FileType.Directory } as any);
    await cache.set(url, "data", headers);
    // When
    const result = await cache.get(url);
    // Then
    assert.strictEqual(result, undefined);
  });

  test("get should return existing data when stat throws error", async () => {
    // Given
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    const url = "error-url";
    (fakeFs.stat as sinon.SinonStub).rejects(new Error("stat error"));
    await cache.set(url, "data", headers);
    // When
    const result = await cache.get(url);
    // Then
    assert.ok(result);
    assert.deepStrictEqual(result!.headers, headers);
    assert.ok(result!.data instanceof vscode.Uri);
  });

  test("set should not throw when writeFile fails", async () => {
    // Given
    fakeFs.writeFile = sandbox.stub().rejects(new Error("write error"));
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    // When
    const action = () => cache.set("u-error", "d", headers);
    // Then
    await assert.doesNotReject(action);
  });

  test("invalidate does nothing for unknown key", async () => {
    // Given
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    // When
    await cache.invalidate("unknown-key");
    // Then
    assert.strictEqual(cache.size, 0);
  });

  test("invalidate should not throw when delete fails", async () => {
    // Given
    fakeFs.delete = sandbox.stub().rejects(new Error("delete error"));
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    await cache.set("u2", "d", headers);
    // When
    const action = () => cache.invalidate("u2");
    // Then
    await assert.doesNotReject(action);
    assert.strictEqual(cache.size, 0);
  });

  test("clear should not throw when delete fails", async () => {
    // Given
    fakeFs.delete = sandbox.stub().rejects(new Error("clear error"));
    const cache = new FileCache(extCtx as any, 5, fakeFs as any);
    await cache.set("u1", "d1", headers);
    await cache.set("u2", "d2", headers);
    // When
    const action = () => cache.clear();
    // Then
    await assert.doesNotReject(action);
    assert.strictEqual(cache.size, 0);
  });
});
