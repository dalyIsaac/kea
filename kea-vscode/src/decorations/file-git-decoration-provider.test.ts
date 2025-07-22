import * as assert from "assert";
import * as vscode from "vscode";
import { IAccountKey } from "../account/account";
import { FileStatus, RepoId } from "../types/kea";
import { createGitDecorationUri } from "./decoration-schemes";
import { FileGitDecorationProvider } from "./file-git-decoration-provider";

suite("FileGitDecorationProvider", () => {
  test("Returns null when the payload parsing fails", async () => {
    // Given
    const provider = new FileGitDecorationProvider();
    const uri = vscode.Uri.from({
      scheme: "kea-files",
      query: "invalid-json",
    });

    // When
    const decoration = await provider.provideFileDecoration(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(decoration, null);
  });

  test("Returns null when the decoration scheme is not files", async () => {
    // Given
    const provider = new FileGitDecorationProvider();
    const uri = vscode.Uri.from({
      scheme: "kea-comments-root",
      query: JSON.stringify({}),
    });

    // When
    const decoration = await provider.provideFileDecoration(uri, new vscode.CancellationTokenSource().token);

    // Then
    assert.strictEqual(decoration, null);
  });

  const fileStatusVariants: Array<{
    status: FileStatus;
    expected: { badge: string; colorTheme: string };
  }> = [
    {
      status: "A",
      expected: { badge: "A", colorTheme: "gitDecoration.addedResourceForeground" },
    },
    {
      status: "M",
      expected: { badge: "M", colorTheme: "gitDecoration.modifiedResourceForeground" },
    },
    {
      status: "D",
      expected: { badge: "D", colorTheme: "gitDecoration.deletedResourceForeground" },
    },
    {
      status: "R",
      expected: { badge: "R", colorTheme: "gitDecoration.renamedResourceForeground" },
    },
    {
      status: "C",
      expected: { badge: "C", colorTheme: "gitDecoration.copiedResourceForeground" },
    },
    {
      status: "T",
      expected: { badge: "T", colorTheme: "gitDecoration.ignoredResourceForeground" },
    },
    {
      status: "U",
      expected: { badge: "U", colorTheme: "gitDecoration.untrackedResourceForeground" },
    },
  ];

  for (const { status, expected } of fileStatusVariants) {
    test(`Returns correct decoration for file status: ${status}`, async () => {
      // Given
      const provider = new FileGitDecorationProvider();
      const accountKey: IAccountKey = { providerId: "github", accountId: "accountId" };
      const repoId: RepoId = { owner: "owner", repo: "repo" };
      const uri = createGitDecorationUri({
        accountKey,
        repoId,
        filePath: "test/file.ts",
        fileStatus: status,
      });

      // When
      const decoration = await provider.provideFileDecoration(uri, new vscode.CancellationTokenSource().token);

      // Then
      assert.notStrictEqual(decoration, null);
      if (decoration) {
        assert.strictEqual(decoration.badge, expected.badge);
        assert.strictEqual(decoration.color!.id, expected.colorTheme);
      }
    });
  }
});
