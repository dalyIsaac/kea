import { PullRequestComment } from "~/api/types";
import { MonacoMode } from "~/components/monaco/types";
import { CommentViewZone } from "~/monaco/comment-view-zone";
import { Editor, monaco } from "~/monaco/types";

export class CommentStore {
  static #instance: CommentStore | null = null;

  static fromComments = (comments: PullRequestComment[] | undefined): CommentStore => {
    this.#instance ??= new CommentStore();
    if (comments) {
      this.#instance.updateComments(comments);
    }
    return this.#instance;
  };

  #modifiedFileStoreMap = new Map<string, CommentFileStore>();

  // Required for singleton pattern.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public updateComments = (comments: PullRequestComment[]): void => {
    for (const comment of comments) {
      this.addComment(comment);
    }
  };

  public addComment = (comment: PullRequestComment): void => {
    const fileStore = this.#modifiedFileStoreMap.get(comment.path) ?? new CommentFileStore();
    fileStore.addComment(comment);
    this.#modifiedFileStoreMap.set(comment.path, fileStore);
  };

  public updateViewZones = (editor: Editor, mode: MonacoMode): void => {
    if (mode === "single") {
      this.#updateSingleEditorViewZones(editor as monaco.editor.IStandaloneCodeEditor);
      return;
    }

    this.#updateDiffEditorViewZones(editor as monaco.editor.IStandaloneDiffEditor);
  };

  #updateSingleEditorViewZones = (editor: monaco.editor.IStandaloneCodeEditor): void => {
    const path = editor.getModel()?.uri.path;
    if (!path) {
      return;
    }

    const fileStore = this.#modifiedFileStoreMap.get(path);
    if (!fileStore) {
      return;
    }

    editor.changeViewZones((accessor) => {
      fileStore.originalStore.updateViewZones(accessor);
    });
  };

  #updateDiffEditorViewZones = (editor: monaco.editor.IStandaloneDiffEditor): void => {
    const modifiedPath = editor.getModifiedEditor().getModel()?.uri.path;
    if (!modifiedPath) {
      return;
    }

    const fileStore = this.#modifiedFileStoreMap.get(modifiedPath);
    if (!fileStore) {
      return;
    }

    editor
      .getOriginalEditor()
      .changeViewZones((accessor) => fileStore.originalStore.updateViewZones(accessor));
    editor
      .getModifiedEditor()
      .changeViewZones((accessor) => fileStore.modifiedStore.updateViewZones(accessor));
  };
}

/**
 * Manages comments for a file.
 */
class CommentFileStore {
  readonly originalStore = new CommentFileSideStore("original");
  readonly modifiedStore = new CommentFileSideStore("modified");

  public addComment = (comment: PullRequestComment): void => {
    if (comment.original_position) {
      this.originalStore.addComment(comment);
    }

    if (comment.modified_position) {
      this.modifiedStore.addComment(comment);
    }
  };
}

type Side = "original" | "modified";

/**
 * Manages comments for a file, on a specific side of the editor.
 */
class CommentFileSideStore {
  #side: Side;

  #viewZonesCache = new Map<number, CommentViewZone>();

  #commentsMap = new Map<number, PullRequestComment>();

  constructor(side: Side) {
    this.#side = side;
  }

  public addComment = (comment: PullRequestComment): void => {
    this.#commentsMap.set(comment.id, comment);
  };

  public updateViewZones = (accessor: monaco.editor.IViewZoneChangeAccessor): void => {
    for (const comment of this.#commentsMap.values()) {
      if (this.#viewZonesCache.has(comment.id)) {
        continue;
      }

      const viewZone = new CommentViewZone(comment, this.#getPosition(comment));
      this.#viewZonesCache.set(comment.id, viewZone);
      accessor.addZone(viewZone);
    }
  };

  #getPosition = (comment: PullRequestComment) =>
    // CommentFileSideStore only contains comments for this side.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.#side === "original" ? comment.original_position! : comment.modified_position!;
}
