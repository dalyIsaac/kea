import { DiffEntry, ReviewComment } from "~/api/types";
import { Editor } from "~/monaco";
import { getOriginalFilename } from "~/utils/git";
import { ReviewEditorModel } from "./review-editor-model";

export class ReviewModelStore {
  static #instance: ReviewModelStore | undefined;

  #gitRef: string;
  #modelMap = new Map<string, ReviewEditorModel>();

  private constructor(gitRef: string, diffEntries: DiffEntry[]) {
    this.#gitRef = gitRef;

    for (const diffEntry of diffEntries) {
      this.#modelMap.set(diffEntry.current_filename, new ReviewEditorModel(diffEntry));
    }
  }

  static get(gitRef: string | undefined, diffEntries: DiffEntry[] | undefined): ReviewModelStore | undefined {
    if (gitRef === undefined || diffEntries === undefined) {
      ReviewModelStore.#instance = undefined;
      return ReviewModelStore.#instance;
    }

    if (ReviewModelStore.#instance === undefined) {
      ReviewModelStore.#instance = new ReviewModelStore(gitRef, diffEntries);
      return ReviewModelStore.#instance;
    }

    if (ReviewModelStore.#instance.#gitRef !== gitRef) {
      ReviewModelStore.#instance = new ReviewModelStore(gitRef, diffEntries);
      return ReviewModelStore.#instance;
    }

    ReviewModelStore.#instance.#updateModels(diffEntries);
    return ReviewModelStore.#instance;
  }

  #updateModels = (diffEntries: DiffEntry[]): void => {
    for (const diffEntry of diffEntries) {
      const path = getOriginalFilename(diffEntry);

      if (path === undefined || this.#modelMap.has(path)) {
        continue;
      }

      this.#modelMap.set(path, new ReviewEditorModel(diffEntry));
    }
  };

  loadComments = (comments: ReviewComment[] | undefined, editor: Editor): void => {
    if (comments === undefined) {
      return;
    }

    for (const comment of comments) {
      this.#addComment(comment, editor);
    }
  };

  #addComment = (comment: ReviewComment, editor: Editor): void => {
    const model = this.getModel(comment.path);
    if (model === undefined) {
      return;
    }

    let startLine: number | undefined;
    if (comment.original_commit_id === this.#gitRef) {
      startLine = ReviewModelStore.#getOriginalStartLine(comment);
    } else if (comment.commit_id === this.#gitRef) {
      startLine = ReviewModelStore.#getStartLine(comment);
    } else {
      return;
    }

    if (startLine === undefined) {
      return;
    }

    model.addComment({ data: comment, startLine }, editor);
  };

  getModel = (path: string | undefined): ReviewEditorModel | undefined => {
    if (path === undefined) {
      return undefined;
    }

    const model = this.#modelMap.get(path);
    return model;
  };

  static #getOriginalStartLine = (comment: ReviewComment): number | undefined => {
    if (comment.original_start_line === undefined) {
      return undefined;
    }

    return comment.original_start_line ?? undefined;
  };

  static #getStartLine = (comment: ReviewComment): number | undefined => {
    if (comment.start_line === undefined) {
      return undefined;
    }

    return comment.start_line ?? undefined;
  };
}
