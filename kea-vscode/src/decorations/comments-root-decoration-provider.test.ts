import * as assert from "assert";
import * as vscode from "vscode";
import { RepositoryManager } from "../repository/repository-manager";
import { createAccountStub, createIssueCommentStub, createPullRequestCommentStub, createRepositoryStub } from "../test-utils";
import { IssueComment, PullRequestComment, RepoId } from "../types/kea";
import { CommentsRootDecorationProvider } from "./comments-root-decoration-provider";
import { createCommentsRootDecorationUri } from "./decoration-schemes";

suite("CommentsRootDecorationProvider", () => {
  test("Returns null when the URI is not a comments root URI", async () => {
    // Given
    const repositoryManager = new RepositoryManager();
    const provider = new CommentsRootDecorationProvider(repositoryManager);
    const uri = vscode.Uri.parse("file:///test.txt");

    // When
    const decoration = await provider.provideFileDecoration(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(decoration, null);
  });

  test("Returns null when the decorations scheme is not commentsRoot", async () => {
    // Given
    const repositoryManager = new RepositoryManager();
    const provider = new CommentsRootDecorationProvider(repositoryManager);
    const uri = vscode.Uri.from({ scheme: "kea-files", query: JSON.stringify({}) });

    // When
    const decoration = await provider.provideFileDecoration(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(decoration, null);
  });

  test("Returns null when the repository cannot be found", async () => {
    // Given
    const repositoryManager = new RepositoryManager();
    const provider = new CommentsRootDecorationProvider(repositoryManager);
    const uri = vscode.Uri.from({
      scheme: "kea-comments-root",
      query: JSON.stringify({
        accountKey: { accountId: "invalid", providerId: "invalid" },
        pullId: { owner: "owner", repo: "repo", number: 1 },
      }),
    });

    // When
    const decoration = await provider.provideFileDecoration(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(decoration, null);
  });

  const successVariants: Array<{
    description: string;
    reviewComments: Error | PullRequestComment[];
    issueComments: Error | IssueComment[];
    expected: { badge: string; tooltip: string };
  }> = [
    {
      description: "both review and issue comments fail",
      reviewComments: new Error("Review comments API call failed"),
      issueComments: new Error("Issue comments API call failed"),
      expected: { badge: "0", tooltip: "Comments (0)" },
    },
    {
      description: "issue comments fail",
      reviewComments: [],
      issueComments: new Error("Issue comments API call failed"),
      expected: { badge: "0", tooltip: "Comments (0)" },
    },
    {
      description: "review comments fail",
      reviewComments: new Error("Review comments API call failed"),
      issueComments: [],
      expected: { badge: "0", tooltip: "Comments (0)" },
    },
    {
      description: "both review and issue comments are empty",
      reviewComments: [],
      issueComments: [],
      expected: { badge: "0", tooltip: "Comments (0)" },
    },
    {
      description: "only review comments are present",
      reviewComments: [createPullRequestCommentStub({ id: 1, body: "Test review comment 1" })],
      issueComments: new Error("Issue comments API call failed"),
      expected: { badge: "1", tooltip: "Comments (1)" },
    },
    {
      description: "only issue comments are present",
      reviewComments: new Error("Review comments API call failed"),
      issueComments: [createIssueCommentStub({ id: 1, body: "Test issue comment 1" })],
      expected: { badge: "1", tooltip: "Comments (1)" },
    },
    {
      description: "both review and issue comments are present",
      reviewComments: [createPullRequestCommentStub({ id: 1, body: "Test review comment 1" })],
      issueComments: [
        createIssueCommentStub({ id: 1, body: "Test issue comment 1" }),
        createIssueCommentStub({ id: 2, body: "Test issue comment 2" }),
      ],
      expected: { badge: "3", tooltip: "Comments (3)" },
    },
    {
      description: "there are more than 9 comments",
      reviewComments: [
        createPullRequestCommentStub({ id: 1, body: "Test review comment 1" }),
        createPullRequestCommentStub({ id: 2, body: "Test review comment 2" }),
        createPullRequestCommentStub({ id: 3, body: "Test review comment 3" }),
      ],
      issueComments: Array.from({ length: 7 }, (_, i) => createIssueCommentStub({ id: i + 1, body: `Test issue comment ${i + 1}` })),
      expected: { badge: "9+", tooltip: "Comments (10)" },
    },
  ];

  for (const { description, reviewComments, issueComments, expected } of successVariants) {
    test(`Returns correct decoration when ${description}`, async () => {
      // Given
      const repoId: RepoId = { owner: "owner", repo: "repo" };
      const accountKey = { providerId: "github", accountId: "accountId" };
      const repository = createRepositoryStub({
        account: createAccountStub({ accountKey }),
        repoId,
        getPullRequestReviewComments: () => Promise.resolve(reviewComments),
        getIssueComments: () => Promise.resolve(issueComments),
      });
      const repositoryManager = new RepositoryManager();
      repositoryManager.addRepository(repository);

      const provider = new CommentsRootDecorationProvider(repositoryManager);
      const uri = createCommentsRootDecorationUri({ accountKey, pullId: { ...repoId, number: 1 } });

      // When
      const decoration = await provider.provideFileDecoration(uri, new vscode.CancellationTokenSource().token);

      // Then
      assert.strictEqual(decoration?.badge, expected.badge);
      assert.strictEqual(decoration.tooltip, expected.tooltip);
    });
  }
});
