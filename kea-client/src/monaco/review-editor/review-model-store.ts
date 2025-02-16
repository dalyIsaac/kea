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
    let endLine: number | undefined;
    if (comment.original_commit_id === this.#gitRef) {
      [startLine, endLine] = getOriginalLines(comment);
    } else if (comment.commit_id === this.#gitRef) {
      [startLine, endLine] = getLines(comment);
    } else {
      return;
    }

    if (startLine === undefined || endLine === undefined) {
      return;
    }

    model.addComment({ data: comment, startLine, endLine }, editor);
  };

  getModel = (path: string | undefined): ReviewEditorModel | undefined => {
    if (path === undefined) {
      return undefined;
    }

    const model = this.#modelMap.get(path);
    return model;
  };
}

type ReviewCommentPosition = [number | undefined, number | undefined] | [];

const getOriginalLines = (comment: ReviewComment): ReviewCommentPosition => {
  if (comment.original_line === undefined || comment.original_line === null) {
    return [];
  }

  return [comment.original_start_line ?? comment.original_line, comment.original_line];
};

const getLines = (comment: ReviewComment): ReviewCommentPosition => {
  if (comment.line === undefined || comment.line === null) {
    return [];
  }

  return [comment.start_line ?? comment.line, comment.line];
};
