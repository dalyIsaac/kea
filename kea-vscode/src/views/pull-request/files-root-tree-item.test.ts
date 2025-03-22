import * as assert from "assert";
import { createAccountStub, createPullRequestCommentStub, createPullRequestFileStub } from "../../test-utils";
import { PullRequestId } from "../../types/kea";
import { FileTreeItem } from "./file-tree-item";
import { FilesRootTreeItem } from "./files-root-tree-item";
import { FolderTreeItem } from "./folder-tree-item";
import { ReviewCommentTreeItem } from "./review-comment-tree-item";

suite("FilesRootTreeItem", () => {
  const pullId: PullRequestId = { owner: "owner", repo: "repo", number: 1 };

  test("Returns an empty array when the files API call fails", async () => {
    // Given
    const account = createAccountStub({
      getPullRequestFiles: (_id) => Promise.resolve(new Error("API call failed")),
    });

    // When
    const filesRootTreeItem = new FilesRootTreeItem(account, pullId);
    const children = await filesRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Continues to return an empty array when the review comments API call fails", async () => {
    // Given
    const account = createAccountStub({
      getPullRequestFiles: (_id) => Promise.resolve([createPullRequestFileStub({ filename: "README.md" })]),
      getPullRequestReviewComments: (_id) => Promise.resolve(new Error("API call failed")),
    });

    // When
    const filesRootTreeItem = new FilesRootTreeItem(account, pullId);
    const children = await filesRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 1);
  });

  test("Returns an empty array when there are no files", async () => {
    // Given
    const account = createAccountStub({
      getPullRequestFiles: (_id) => Promise.resolve([]),
    });

    // When
    const filesRootTreeItem = new FilesRootTreeItem(account, pullId);
    const children = await filesRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Returns a single file when there is one file", async () => {
    // Given
    const account = createAccountStub({
      getPullRequestFiles: (_id) => Promise.resolve([createPullRequestFileStub({ filename: "README.md" })]),
      getPullRequestReviewComments: (_id) => Promise.resolve([]),
    });

    // When
    const filesRootTreeItem = new FilesRootTreeItem(account, pullId);
    const children = await filesRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 1);
    const readme = children[0]!;
    assert.strictEqual(readme.label, "README.md");
    assert.ok(readme instanceof FileTreeItem);
  });

  test("Returns a tree structure for files", async () => {
    // Given
    const account = createAccountStub({
      getPullRequestFiles: (_id) =>
        Promise.resolve([
          createPullRequestFileStub({ filename: "src/components/Button.tsx" }),
          createPullRequestFileStub({ filename: "src/components/Modal.tsx" }),
          createPullRequestFileStub({ filename: "src/utils/helpers.ts" }),
          createPullRequestFileStub({ filename: "README.md" }),
        ]),
      getPullRequestReviewComments: (_id) => Promise.resolve([]),
    });

    // When
    const filesRootTreeItem = new FilesRootTreeItem(account, pullId);
    const children = await filesRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 2);

    const readme = children[0]!;
    assert.strictEqual(readme.label, "README.md");
    assert.ok(readme instanceof FileTreeItem);

    const src = children[1] as FolderTreeItem;
    assert.strictEqual(src.label, "src");
    assert.ok(src instanceof FolderTreeItem);
    assert.strictEqual(src.children.length, 2);

    const components = src.children[0] as FolderTreeItem;
    assert.strictEqual(components.label, "components");
    assert.ok(components instanceof FolderTreeItem);
    assert.strictEqual(components.children.length, 2);

    const button = components.children[0]!;
    assert.strictEqual(button.label, "Button.tsx");
    assert.ok(button instanceof FileTreeItem);

    const modal = components.children[1]!;
    assert.strictEqual(modal.label, "Modal.tsx");
    assert.ok(modal instanceof FileTreeItem);

    const utils = src.children[1] as FolderTreeItem;
    assert.strictEqual(utils.label, "utils");
    assert.ok(utils instanceof FolderTreeItem);
    assert.strictEqual(utils.children.length, 1);

    const helpers = utils.children[0]!;
    assert.strictEqual(helpers.label, "helpers.ts");
    assert.ok(helpers instanceof FileTreeItem);
  });

  test("Returns a single file with multiple review comments", async () => {
    // Given
    const account = createAccountStub({
      getPullRequestFiles: (_id) => Promise.resolve([createPullRequestFileStub({ filename: "README.md" })]),
      getPullRequestReviewComments: (_id) =>
        Promise.resolve([
          createPullRequestCommentStub({ body: "Comment 1", path: "README.md" }),
          createPullRequestCommentStub({ body: "Comment 2", path: "README.md" }),
          createPullRequestCommentStub({ body: "Comment 3", path: "not-readme.md" }),
        ]),
    });

    // When
    const filesRootTreeItem = new FilesRootTreeItem(account, pullId);
    const children = await filesRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 1);
    const readme = children[0]!;
    assert.strictEqual(readme.label, "README.md");
    assert.ok(readme instanceof FileTreeItem);

    const reviewComments = readme.getChildren();
    assert.strictEqual(reviewComments.length, 2);
    assert.ok(reviewComments[0] instanceof ReviewCommentTreeItem);
    assert.ok(reviewComments[1] instanceof ReviewCommentTreeItem);
  });
});
