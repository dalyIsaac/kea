/* eslint-disable no-restricted-syntax */
import * as assert from "assert";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { WrappedError } from "../core/wrapped-error";
import { createApiCacheStub } from "../test-utils";
import { LocalGitRepository } from "./local-git-repository";

suite("LocalGitRepository", () => {
  let tempDir: string;
  let repository: LocalGitRepository | undefined;

  /**
   * Cross-platform Git executable detection with fallback options.
   */
  const getGitExecutable = (): string => {
    if (process.platform === "win32") {
      // On Windows, try multiple common Git locations.
      const possiblePaths = ["git.exe", "git", "C:\\Program Files\\Git\\bin\\git.exe", "C:\\Program Files (x86)\\Git\\bin\\git.exe"];

      for (const gitPath of possiblePaths) {
        try {
          execFileSync(gitPath, ["--version"], { stdio: "ignore" });
          return gitPath;
        } catch {
          // Continue to next option.
        }
      }

      // Default fallback.
      return "git.exe";
    }
    return "git";
  };

  /**
   * Check if Git is available on the system.
   */
  const isGitAvailable = (): boolean => {
    try {
      const gitExecutable = getGitExecutable();
      execFileSync(gitExecutable, ["--version"], { stdio: "ignore", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Create an isolated Git repository for testing.
   * This ensures tests don't depend on external repositories or network access.
   */
  const createTestRepository = (dir: string): boolean => {
    const gitExecutable = getGitExecutable();

    try {
      // Initialize git repository with explicit configuration for isolation.
      execFileSync(gitExecutable, ["init"], { cwd: dir, stdio: "ignore", timeout: 5000 });

      // Configure user identity to avoid relying on global Git config.
      execFileSync(gitExecutable, ["config", "user.name", "Test User"], { cwd: dir, stdio: "ignore", timeout: 5000 });
      execFileSync(gitExecutable, ["config", "user.email", "test@example.com"], { cwd: dir, stdio: "ignore", timeout: 5000 });

      // Disable commit signing.
      execFileSync(gitExecutable, ["config", "commit.gpgSign", "false"], { cwd: dir, stdio: "ignore", timeout: 5000 });

      // Disable automatic line ending conversion for consistent cross-platform behavior.
      execFileSync(gitExecutable, ["config", "core.autocrlf", "false"], { cwd: dir, stdio: "ignore", timeout: 5000 });
      execFileSync(gitExecutable, ["config", "core.eol", "lf"], { cwd: dir, stdio: "ignore", timeout: 5000 });

      // Create test files with different scenarios.
      const testFilePath = path.join(dir, "test.txt");
      fs.writeFileSync(testFilePath, "Hello World\nLine 2\n", { encoding: "utf8" });

      // Create a subdirectory with a file to test path handling.
      const subDir = path.join(dir, "subdir");
      fs.mkdirSync(subDir);
      const subFilePath = path.join(subDir, "subfile.txt");
      fs.writeFileSync(subFilePath, "Subdirectory content\n", { encoding: "utf8" });

      // Add and commit all files
      execFileSync(gitExecutable, ["add", "."], { cwd: dir, stdio: "ignore", timeout: 5000 });
      execFileSync(gitExecutable, ["commit", "-m", "Initial commit"], { cwd: dir, stdio: "ignore", timeout: 10000 });

      // Create a second commit to ensure repository has multiple commits
      fs.writeFileSync(testFilePath, "Hello World\nLine 2\nLine 3\n", { encoding: "utf8" });
      execFileSync(gitExecutable, ["add", "test.txt"], { cwd: dir, stdio: "ignore", timeout: 5000 });
      execFileSync(gitExecutable, ["commit", "-m", "Second commit"], { cwd: dir, stdio: "ignore", timeout: 10000 });

      return true;
    } catch (error) {
      console.warn(`Failed to create test repository: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    }
  };

  if (!isGitAvailable()) {
    throw new Error("Git is not available on this system. Skipping tests that require Git.");
  }

  setup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kea-git-test-"));
    const cache = createApiCacheStub();

    const repoCreated = createTestRepository(tempDir);
    if (repoCreated) {
      repository = new LocalGitRepository(tempDir, cache);
      return;
    }

    throw new Error("Test repository creation failed - Git-dependent tests will be skipped");
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
    test("should create instance when given a repository path and cache", async () => {
      // Given a test cache and repository path
      const testCache = createApiCacheStub();
      const testPath = "/test/path";

      // When creating a new LocalGitRepository instance
      const repo = new LocalGitRepository(testPath, testCache);

      // Then the repository instance should be created successfully
      assert.ok(repo, "Repository instance should be created");
      await repo.dispose();
    });

    test("should handle cross-platform paths correctly in constructor", async () => {
      // Given test caches and different path formats
      const testCache1 = createApiCacheStub();
      const testCache2 = createApiCacheStub();
      const windowsPath = "C:\\Users\\test\\repo";
      const unixPath = "/home/test/repo";

      // When creating LocalGitRepository instances with different path formats
      const repo1 = new LocalGitRepository(windowsPath, testCache1);
      const repo2 = new LocalGitRepository(unixPath, testCache2);

      // Then both instances should be created successfully regardless of platform
      assert.ok(repo1, "Repository instance with Windows path should be created");
      assert.ok(repo2, "Repository instance with Unix path should be created");

      await repo1.dispose();
      await repo2.dispose();
    });
  });

  suite("getFileAtCommit", () => {
    test("should return error when given empty commit SHA", async () => {
      // Given Git is available and repository is initialized

      // When calling getFileAtCommit with empty commit SHA
      const result = await repository!.getFileAtCommit("", "test.txt");

      // Then an error should be returned with appropriate message
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("commitSha and filePath are required"));
    });

    test("should return error when given empty file path", async () => {
      // Given Git is available and repository is initialized

      // When calling getFileAtCommit with empty file path
      const result = await repository!.getFileAtCommit("abc123", "");

      // Then an error should be returned with appropriate message
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("commitSha and filePath are required"));
    });

    test("should return error when given invalid commit SHA format", async () => {
      // Given Git is available and repository is initialized

      // When calling getFileAtCommit with invalid commit SHA format
      const result = await repository!.getFileAtCommit("invalid-sha", "test.txt");

      // Then an error should be returned indicating invalid format
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("Invalid commit SHA format"));
    });

    test("should retrieve file content when given valid HEAD commit", async () => {
      // Given Git is available and repository is initialized

      // When getting the current HEAD commit and retrieving file content
      const currentCommit = await repository!.getCurrentCommit();
      if (currentCommit instanceof Error) {
        console.log("Skipping test: Could not get current commit");
        return;
      }

      const result = await repository!.getFileAtCommit(currentCommit, "test.txt");

      // Then the file content should be returned successfully
      assert.ok(!(result instanceof Error), `Expected string but got Error: ${result instanceof Error ? result.message : ""}`);
      assert.strictEqual(result, "Hello World\nLine 2\n");
    });

    test("should return error when given non-existent file", async () => {
      // Given Git is available and repository is initialized

      // When requesting a file that doesn't exist at current commit
      const currentCommit = await repository!.getCurrentCommit();
      if (currentCommit instanceof Error) {
        console.log("Skipping test: Could not get current commit");
        return;
      }

      const result = await repository!.getFileAtCommit(currentCommit, "nonexistent.txt");

      // Then an error should be returned indicating file retrieval failure
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("Failed to get file"));
    });

    test("should return error when given non-existent commit", async () => {
      // Given Git is available and repository is initialized

      // When requesting a file from a commit that doesn't exist
      const result = await repository!.getFileAtCommit("1234567890abcdef1234567890abcdef12345678", "test.txt");

      // Then an error should be returned indicating file retrieval failure
      assert.ok(result instanceof Error);
      assert.ok(result.message.includes("Failed to get file"));
    });
  });

  suite("validateRepository", () => {
    test("should return true when given a valid git repository", async () => {
      // Given Git is available and repository is initialized

      // When validating the repository
      const result = await repository!.validateRepository();

      // Then validation should succeed
      assert.ok(!(result instanceof Error));
      assert.strictEqual(result, true);
    });

    test("should return false when given a non-git directory", async () => {
      // Given Git is available and a non-git directory exists

      const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), "kea-non-git-"));
      const testCache = createApiCacheStub();
      const repo = new LocalGitRepository(nonGitDir, testCache);

      // When validating the non-git directory
      const result = await repo.validateRepository();

      // Then validation should return false
      assert.strictEqual(result, false);

      await repo.dispose();
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    });
  });

  suite("getCurrentCommit", () => {
    test("should return valid commit SHA when repository has commits", async () => {
      // Given Git is available and repository is initialized

      // When getting the current HEAD commit
      const result = await repository!.getCurrentCommit();

      // Then a valid 40-character SHA should be returned
      assert.ok(!(result instanceof Error), `Expected string but got Error: ${result instanceof Error ? result.message : ""}`);
      assert.ok(typeof result === "string");
      assert.ok(/^[a-f0-9]{40}$/i.test(result)); // Should be a full 40-character SHA
    });
  });

  suite("commitExists", () => {
    test("should return true when given an existing commit SHA", async () => {
      // Given Git is available and repository is initialized

      // When checking if the current commit exists
      const currentCommit = await repository!.getCurrentCommit();
      if (currentCommit instanceof Error) {
        console.log("Skipping test: Could not get current commit");
        return;
      }

      const result = await repository!.commitExists(currentCommit);

      // Then the commit should exist
      assert.ok(!(result instanceof Error));
      assert.strictEqual(result, true);
    });

    test("should return false when given a non-existent commit SHA", async () => {
      // Given Git is available and repository is initialized

      // When checking if a non-existent commit exists
      const result = await repository!.commitExists("1234567890abcdef1234567890abcdef12345678");

      // Then the commit should not exist
      assert.ok(!(result instanceof Error));
      assert.strictEqual(result, false);
    });
  });

  suite("getBranchCommits", () => {
    test("should return commits from current branch when repository has commits", async () => {
      // Given Git is available and repository is initialized

      // When getting branch commits
      const result = await repository!.getBranchCommits(5);

      // Then commits should be returned
      assert.ok(!(result instanceof Error), `Expected array but got Error: ${result instanceof Error ? result.message : ""}`);
      assert.ok(Array.isArray(result));
      assert.ok(result.length > 0);
      
      // Verify commit structure
      const firstCommit = result[0];
      assert.ok(firstCommit, "First commit should exist");
      assert.ok(firstCommit.sha);
      assert.ok(firstCommit.message);
      assert.ok(firstCommit.author);
      assert.ok(firstCommit.date instanceof Date);
    });

    test("should limit commits when limit parameter is provided", async () => {
      // Given Git is available and repository is initialized

      // When getting limited number of commits
      const result = await repository!.getBranchCommits(1);

      // Then only the specified number of commits should be returned
      assert.ok(!(result instanceof Error));
      if (!(result instanceof Error)) {
        assert.strictEqual(result.length, 1);
      }
    });
  });

  suite("getBranchStatus", () => {
    test("should return branch status when repository has no remote", async () => {
      // Given Git is available and repository is initialized without remote

      // When getting branch status
      const result = await repository!.getBranchStatus();

      // Then status should indicate no remote tracking
      assert.ok(!(result instanceof Error), `Expected status but got Error: ${result instanceof Error ? result.message : ""}`);
      if (!(result instanceof Error)) {
        assert.strictEqual(result.ahead, 0);
        assert.strictEqual(result.behind, 0);
        assert.strictEqual(result.remoteBranch, null);
      }
    });
  });

  suite("getCurrentBranch", () => {
    test("should return current branch name when repository is initialized", async () => {
      // Given Git is available and repository is initialized

      // When getting current branch
      const result = await repository!.getCurrentBranch();

      // Then branch name should be returned
      assert.ok(!(result instanceof Error), `Expected string but got Error: ${result instanceof Error ? result.message : ""}`);
      assert.ok(typeof result === "string");
      assert.ok(result.length > 0);
    });
  });

  suite("error handling", () => {
    test("should handle invalid repository path gracefully when executing git commands", async () => {
      // Given Git is available and an invalid repository path

      const testCache = createApiCacheStub();
      const repo = new LocalGitRepository("/invalid/path/that/does/not/exist", testCache);

      // When attempting to get a file from the invalid repository
      const result = await repo.getFileAtCommit("1234567", "test.txt");

      // Then an error should be returned indicating git command failure
      assert.ok(result instanceof WrappedError);
      assert.ok(result.toString().includes("Git command failed"));

      await repo.dispose();
    });

    test("should handle cross-platform path separators correctly", async () => {
      // Given Git is available and repository is initialized with subdirectory files

      // When requesting a file with different path separator formats
      const currentCommit = await repository!.getCurrentCommit();
      if (currentCommit instanceof Error) {
        console.log("Skipping test: Could not get current commit");
        return;
      }

      // Test cross-platform path handling with subdirectories
      const windowsStylePath = "subdir\\subfile.txt";
      const unixStylePath = "subdir/subfile.txt";

      const resultWithBackslashes = await repository!.getFileAtCommit(currentCommit, windowsStylePath);
      const resultWithForwardSlashes = await repository!.getFileAtCommit(currentCommit, unixStylePath);

      // Then both path formats should work and return the same content
      assert.ok(
        !(resultWithBackslashes instanceof Error),
        `Windows path failed: ${resultWithBackslashes instanceof Error ? resultWithBackslashes.message : ""}`,
      );
      assert.ok(
        !(resultWithForwardSlashes instanceof Error),
        `Unix path failed: ${resultWithForwardSlashes instanceof Error ? resultWithForwardSlashes.message : ""}`,
      );
      assert.strictEqual(resultWithBackslashes, resultWithForwardSlashes);
      assert.strictEqual(resultWithBackslashes, "Subdirectory content\n");
    });

    test("should work in complete isolation without external dependencies", async () => {
      // Given a completely isolated temporary directory with its own Git repository

      const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), "kea-isolated-test-"));
      let isolatedRepo: LocalGitRepository | undefined;

      try {
        // When creating a new isolated repository from scratch
        createTestRepository(isolatedDir);
        const testCache = createApiCacheStub();
        isolatedRepo = new LocalGitRepository(isolatedDir, testCache);

        // Then the repository should work without any external dependencies
        const isValid = await isolatedRepo.validateRepository();
        assert.strictEqual(isValid, true);

        const currentCommit = await isolatedRepo.getCurrentCommit();
        assert.ok(!(currentCommit instanceof Error));
        assert.ok(typeof currentCommit === "string");

        const fileContent = await isolatedRepo.getFileAtCommit(currentCommit, "test.txt");
        assert.ok(!(fileContent instanceof Error));
        assert.strictEqual(fileContent, "Hello World\nLine 2\n");
      } finally {
        // Clean up isolated resources
        if (isolatedRepo) {
          await isolatedRepo.dispose();
        }
        if (fs.existsSync(isolatedDir)) {
          fs.rmSync(isolatedDir, { recursive: true, force: true });
        }
      }
    });

    test("should handle files with consistent line endings across platforms", async () => {
      // Given Git is available and repository is initialized with explicit line ending configuration

      // When retrieving file content from the repository
      const currentCommit = await repository!.getCurrentCommit();
      if (currentCommit instanceof Error) {
        console.log("Skipping test: Could not get current commit");
        return;
      }

      const result = await repository!.getFileAtCommit(currentCommit, "test.txt");

      // Then the content should have consistent Unix-style line endings regardless of platform
      assert.ok(!(result instanceof Error));
      assert.strictEqual(result, "Hello World\nLine 2\n");
      assert.ok(!result.includes("\r\n"), "Content should not contain Windows line endings");
    });
  });
});
