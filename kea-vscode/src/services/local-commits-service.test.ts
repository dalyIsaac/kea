import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { IAccountKey } from "../account/account";
import { IKeaContext } from "../core/context";
import { ILocalGitRepository, LocalCommit } from "../git/local-git-repository";
import { RepoId } from "../types/kea";
import { LocalCommitsService } from "./local-commits-service";

suite("LocalCommitsService", () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: IKeaContext;
  let accountKey: IAccountKey;
  let repoId: RepoId;
  let service: LocalCommitsService;

  setup(() => {
    sandbox = sinon.createSandbox();
    mockContext = {
      gitManager: {
        getLocalGitRepository: sandbox.stub()
      }
    } as unknown as IKeaContext;
    accountKey = { providerId: "github", accountId: "test-account" };
    repoId = { owner: "test-owner", repo: "test-repo" };
    service = new LocalCommitsService(mockContext, accountKey, repoId);
  });

  teardown(() => {
    sandbox.restore();
  });

  test("getLocalCommits should return null when no workspace folders", async () => {
    // Given
    sandbox.stub(vscode.workspace, "workspaceFolders").value([]);

    // When
    const result = await service.getLocalCommits();

    // Then
    assert.strictEqual(result, null);
  });

  test("getLocalCommits should return null when git repository unavailable", async () => {
    // Given
    const workspaceFolder = { uri: vscode.Uri.file("/test/path") } as vscode.WorkspaceFolder;
    sandbox.stub(vscode.workspace, "workspaceFolders").value([workspaceFolder]);
    
    (mockContext.gitManager.getLocalGitRepository as sinon.SinonStub).resolves(new Error("No git repo"));

    // When
    const result = await service.getLocalCommits();

    // Then
    assert.strictEqual(result, null);
  });

  test("getLocalCommits should return local commits when available", async () => {
    // Given
    const workspaceFolder = { uri: vscode.Uri.file("/test/path") } as vscode.WorkspaceFolder;
    sandbox.stub(vscode.workspace, "workspaceFolders").value([workspaceFolder]);
    
    const localCommits: LocalCommit[] = [
      {
        sha: "abc123",
        message: "Test commit",
        author: "Test Author",
        date: new Date()
      }
    ];
    
    const localGitRepo: ILocalGitRepository = {
      getBranchCommits: sandbox.stub().resolves(localCommits),
      getBranchCommitsAheadOf: sandbox.stub(),
      getCommitFiles: sandbox.stub(),
      getFileAtCommit: sandbox.stub(),
      getCurrentBranch: sandbox.stub(),
      getCurrentCommit: sandbox.stub(),
      getBranchStatus: sandbox.stub(),
      getParentCommit: sandbox.stub(),
      getCommitsForPullRequest: sandbox.stub().resolves(localCommits)
    };
    
    (mockContext.gitManager.getLocalGitRepository as sinon.SinonStub).resolves(localGitRepo);

    // When
    const result = await service.getLocalCommits();

    // Then
    assert.ok(result);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0]!.commit.sha, "abc123");
  });
});