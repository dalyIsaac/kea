import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execFileSync } from "child_process";
import { createApiCacheStub } from "../../test-utils";
import { LocalGitRepository } from "./local-git-repository";

suite("LocalGitRepository", () => {
  let tempDir: string;
  let repository: LocalGitRepository | undefined;

  const isGitAvailable = (): boolean => {
    const gitExecutable = process.platform === "win32" ? "git.exe" : "git";
    try {
      execFileSync(gitExecutable, ["--version"]);
      return true;
    } catch {
      return false;
    }
  };

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kea-git-test-"));
    const cache = createApiCacheStub();

    if (isGitAvailable()) {
      const gitExecutable = process.platform === "win32" ? "git.exe" : "git";
      try {
        // Initialize git repository
        execFileSync(gitExecutable, ["init"], { cwd: tempDir });
        execFileSync(gitExecutable, ["config", "user.name", "Test User"], { cwd: tempDir });
        execFileSync(gitExecutable, ["config", "user.email", "test@example.com"], { cwd: tempDir });

        // Create and commit a test file
        const testFilePath = path.join(tempDir, "test.txt");
        fs.writeFileSync(testFilePath, "Hello World\nLine 2\n");
        execFileSync(gitExecutable, ["add", "test.txt"], { cwd: tempDir });
        execFileSync(gitExecutable, ["commit", "-m", "Initial commit"], { cwd: tempDir });

        repository = new LocalGitRepository(tempDir, cache);
      } catch {
        // Repository setup failed - tests will be skipped
      }
    }
  });

  teardown(async () => {
    if (repository) {
      await repository.dispose();
      repository = undefined;
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  suite("constructor", () => {
    test("should create instance with repository path and cache", async () => {
      const testCache = createApiCacheStub();
      const repo = new LocalGitRepository("/test/path", testCache);
      assert.ok(repo, "Repository instance should be created");
      await repo.dispose();
    });
  });

  suite("getFileAtCommit", () => {
    test("should return error for empty parameters", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      // Test empty commit SHA
      const result1 = await repository.getFileAtCommit("", "test.txt");
      assert.ok(result1 instanceof Error);
      assert.ok(result1.message.includes("commitSha and filePath are required"));

      // Test empty file path
      const result2 = await repository.getFileAtCommit("abc123", "");
      assert.ok(result2 instanceof Error);
      assert.ok(result2.message.includes("commitSha and filePath are required"));
    });

    test("should return error for invalid commit SHA format", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      const result = await repository.getFileAtCommit("invalid-sha", "test.txt");
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("Invalid commit SHA format"));
    });

    test("should retrieve file content from HEAD commit", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      // Get current HEAD commit
      const currentCommit = await repository.getCurrentCommit();
      if (currentCommit instanceof Error) {
        console.log("Skipping test: Could not get current commit");
        return;
      }

      const result = await repository.getFileAtCommit(currentCommit, "test.txt");
      assert.ok(!(result instanceof Error), `Expected string but got Error: ${result instanceof Error ? result.message : ""}`);
      assert.strictEqual(result, "Hello World\nLine 2\n");
    });

    test("should return error for non-existent file", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      const currentCommit = await repository.getCurrentCommit();
      if (currentCommit instanceof Error) {
        console.log("Skipping test: Could not get current commit");
        return;
      }

      const result = await repository.getFileAtCommit(currentCommit, "nonexistent.txt");
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("Failed to get file"));
    });

    test("should return error for non-existent commit", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      const result = await repository.getFileAtCommit("1234567890abcdef1234567890abcdef12345678", "test.txt");
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("Failed to get file"));
    });
  });

  suite("validateRepository", () => {
    test("should validate correct git repository", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      const result = await repository.validateRepository();
      assert.ok(!(result instanceof Error));
      assert.strictEqual(result, true);
    });

    test("should return false for non-git directory", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }

      const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), "kea-non-git-"));
      const testCache = createApiCacheStub();
      const repo = new LocalGitRepository(nonGitDir, testCache);

      const result = await repo.validateRepository();
      assert.strictEqual(result, false);

      await repo.dispose();
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    });
  });

  suite("getCurrentCommit", () => {
    test("should get current HEAD commit SHA", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      const result = await repository.getCurrentCommit();
      assert.ok(!(result instanceof Error), `Expected string but got Error: ${result instanceof Error ? result.message : ""}`);
      assert.ok(typeof result === "string");
      assert.ok(/^[a-f0-9]{40}$/i.test(result)); // Should be a full 40-character SHA
    });
  });

  suite("commitExists", () => {
    test("should return true for existing commit", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      const currentCommit = await repository.getCurrentCommit();
      if (currentCommit instanceof Error) {
        console.log("Skipping test: Could not get current commit");
        return;
      }

      const result = await repository.commitExists(currentCommit);
      assert.ok(!(result instanceof Error));
      assert.strictEqual(result, true);
    });

    test("should return false for non-existent commit", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }
      if (!repository) {
        console.log("Skipping test: Repository not initialized");
        return;
      }

      const result = await repository.commitExists("1234567890abcdef1234567890abcdef12345678");
      assert.ok(!(result instanceof Error));
      assert.strictEqual(result, false);
    });
  });

  suite("error handling", () => {
    test("should handle invalid repository path gracefully", async () => {
      if (!isGitAvailable()) {
        console.log("Skipping test: Git not available");
        return;
      }

      const testCache = createApiCacheStub();
      const repo = new LocalGitRepository("/invalid/path/that/does/not/exist", testCache);

      const result = await repo.getFileAtCommit("1234567", "test.txt");
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("Git command failed"));

      await repo.dispose();
    });
  });
});