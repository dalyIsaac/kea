import * as assert from "assert";
import sinon from "sinon";
import { createAccountStub } from "../../test-utils";
import { PullRequestId } from "../../types/kea";
import { FileTreeItem } from "./file-tree-item";
import { FilesRootTreeItem } from "./files-root-tree-item";
import { FolderTreeItem } from "./folder-tree-item";

suite("FilesRootTreeItem", () => {
  const pullId: PullRequestId = { owner: "owner", repo: "repo", number: 1 };

  test("Returns an empty array when the API call fails", async () => {
    // Given
    const account = createAccountStub({
      getPullRequestFiles: sinon.stub().returns(new Error("API call failed")),
    });

    // When
    const filesRootTreeItem = new FilesRootTreeItem(account, pullId);
    const children = await filesRootTreeItem.getChildren();

    // Then
    assert.strictEqual(children.length, 0);
  });

  test("Returns an empty array when there are no files", async () => {
    // Given
    const account = createAccountStub({
      getPullRequestFiles: sinon.stub().returns([]),
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
      getPullRequestFiles: sinon.stub().returns([{ filename: "README.md" }]),
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
      getPullRequestFiles: sinon
        .stub()
        .returns([
          { filename: "src/components/Button.tsx" },
          { filename: "src/components/Modal.tsx" },
          { filename: "src/utils/helpers.ts" },
          { filename: "README.md" },
        ]),
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
    assert.ok(readme instanceof FileTreeItem);
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
});
