import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { RepoId } from "../../types/kea";
import { CacheResponseHeaders } from "../common/common-api-types";
import { FileCache } from "./file-cache";

suite("FileCache", () => {
  const repoId: RepoId = { owner: "owner", repo: "repo" };
  let sandbox: sinon.SinonSandbox;
  let extCtx: vscode.ExtensionContext;
  let headers: CacheResponseHeaders;
  let fakeFs: vscode.FileSystem;

  setup(() => {
    sandbox = sinon.createSandbox();

    // Create fake FileSystem with stubbed methods using test-utils approach
    const fakeFsPartial: Partial<vscode.FileSystem> = {
      stat: sandbox.stub().resolves({ type: vscode.FileType.File } as vscode.FileStat),
      createDirectory: sandbox.stub().resolves(),
      writeFile: sandbox.stub().resolves(),
      delete: sandbox.stub().resolves(),
    };
    fakeFs = fakeFsPartial as vscode.FileSystem;

    // Minimal extension context stub
    const extCtxPartial: Partial<vscode.ExtensionContext> = {
      globalStorageUri: vscode.Uri.parse("file:///test-storage"),
    };
    extCtx = extCtxPartial as vscode.ExtensionContext;

    headers = { etag: "etag123", lastModified: "2023-01-01" };
  });

  teardown(() => {
    sandbox.restore();
  });

  test("the constructor should initialize with correct maxSize and zero size", () => {
    // Given
    const cache = new FileCache(extCtx, 5, fakeFs);

    // When
    // (No action needed for this test)

    // Then
    assert.strictEqual(cache.maxSize, 5);
    assert.strictEqual(cache.size, 0);
  });

  test("get should return undefined when cache key is not set", async () => {
    // Given
    const cache = new FileCache(extCtx, 5, fakeFs);

    // When
    const result = await cache.get(repoId, "url1");

    // Then
    assert.strictEqual(result, undefined);
  });

  test("set should store file and headers correctly", async () => {
    // Given
    const cache = new FileCache(extCtx, 5, fakeFs);
    const url = "http://example.com/blob";
    const data = "file-content";

    // When
    await cache.set(repoId, url, data, headers);

    // Then
    assert.strictEqual(cache.size, 1);
    const result = await cache.get(repoId, url);
    assert.ok(result);
    assert.deepStrictEqual(result.headers, headers);
    assert.ok(result.data instanceof vscode.Uri);
    // And the URI matches the expected path
    const expectedUri = vscode.Uri.joinPath(extCtx.globalStorageUri, "file-cache", repoId.owner, repoId.repo, url);
    assert.strictEqual(result.data.toString(), expectedUri.toString());
  });

  test("should evict least recently used entry when exceeding maxSize", async () => {
    // Given
    const cache = new FileCache(extCtx, 2, fakeFs);
    await cache.set(repoId, "u1", "d1", headers);
    await cache.set(repoId, "u2", "d2", headers);

    // When
    await cache.set(repoId, "u3", "d3", headers);

    // Then
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(await cache.get(repoId, "u1"), undefined);
    assert.ok(await cache.get(repoId, "u2"));
    assert.ok(await cache.get(repoId, "u3"));
  });

  test("invalidate should remove specific entry", async () => {
    // Given
    const cache = new FileCache(extCtx, 5, fakeFs);
    await cache.set(repoId, "u1", "d1", headers);
    await cache.set(repoId, "u2", "d2", headers);

    // When
    await cache.invalidate(repoId, "u1");

    // Then
    assert.strictEqual(cache.size, 1);
    assert.strictEqual(await cache.get(repoId, "u1"), undefined);
    assert.ok(await cache.get(repoId, "u2"));
  });

  test("clear should remove all entries", async () => {
    // Given
    const cache = new FileCache(extCtx, 5, fakeFs);
    await cache.set(repoId, "u1", "d1", headers);
    await cache.set(repoId, "u2", "d2", headers);

    // When
    await cache.clear();

    // Then
    assert.strictEqual(cache.size, 0);
    assert.strictEqual(await cache.get(repoId, "u1"), undefined);
    assert.strictEqual(await cache.get(repoId, "u2"), undefined);
  });

  test("get should return undefined when file is a directory", async () => {
    // Given
    const cache = new FileCache(extCtx, 5, fakeFs);
    const url = "dir-url";
    (fakeFs.stat as sinon.SinonStub).resolves({ type: vscode.FileType.Directory } as vscode.FileStat);
    await cache.set(repoId, url, "data", headers);

    // When
    const result = await cache.get(repoId, url);

    // Then
    assert.strictEqual(result, undefined);
  });

  test("get should return existing data when stat throws error", async () => {
    // Given
    const cache = new FileCache(extCtx, 5, fakeFs);
    const url = "error-url";
    (fakeFs.stat as sinon.SinonStub).rejects(new Error("stat error"));
    await cache.set(repoId, url, "data", headers);

    // When
    const result = await cache.get(repoId, url);

    // Then
    assert.ok(result);
    assert.deepStrictEqual(result.headers, headers);
    assert.ok(result.data instanceof vscode.Uri);
  });

  test("set should not throw when writeFile fails", async () => {
    // Given
    fakeFs.writeFile = sandbox.stub().rejects(new Error("write error"));
    const cache = new FileCache(extCtx, 5, fakeFs);

    // When
    const action = () => cache.set(repoId, "u-error", "d", headers);

    // Then
    await assert.doesNotReject(action);
  });

  test("invalidate does nothing for unknown key", async () => {
    // Given
    const cache = new FileCache(extCtx, 5, fakeFs);

    // When
    await cache.invalidate(repoId, "unknown-key");

    // Then
    assert.strictEqual(cache.size, 0);
  });

  test("invalidate should not throw when delete fails", async () => {
    // Given
    fakeFs.delete = sandbox.stub().rejects(new Error("delete error"));
    const cache = new FileCache(extCtx, 5, fakeFs);
    await cache.set(repoId, "u2", "d", headers);

    // When
    const action = () => cache.invalidate(repoId, "u2");

    // Then
    await assert.doesNotReject(action);
    assert.strictEqual(cache.size, 0);
  });

  test("clear should not throw when delete fails", async () => {
    // Given
    fakeFs.delete = sandbox.stub().rejects(new Error("clear error"));
    const cache = new FileCache(extCtx, 5, fakeFs);
    await cache.set(repoId, "u1", "d1", headers);
    await cache.set(repoId, "u2", "d2", headers);

    // When
    const action = () => cache.clear();

    // Then
    await assert.doesNotReject(action);
    assert.strictEqual(cache.size, 0);
  });
});
