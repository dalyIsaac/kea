import { DiffEntry, ReviewComment } from "~/api/types";
import { getOriginalFilename } from "~/utils/git";
import { ReviewEditorModel } from "./review-editor-model";

export class ReviewModelStore {
  static #instance: ReviewModelStore | null = null;

  #gitRef: string;
  #modelMap = new Map<string, ReviewEditorModel>();

  private constructor(gitRef: string, diffEntries: DiffEntry[]) {
    this.#gitRef = gitRef;

    for (const diffEntry of diffEntries) {
      const path = diffEntry.current_filename ?? diffEntry.original_filename ?? "";
      this.#modelMap.set(path, new ReviewEditorModel(diffEntry));
    }
  }

  static get(gitRef: string | undefined, diffEntries: DiffEntry[] | undefined): ReviewModelStore | null {
    if (!gitRef || !diffEntries) {
      ReviewModelStore.#instance = null;
      return ReviewModelStore.#instance;
    }

    if (!ReviewModelStore.#instance) {
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
      const path = getOriginalFilename(diffEntry) ?? "";
      this.#modelMap.set(path, new ReviewEditorModel(diffEntry));
    }
  };

  loadComments = (comments: ReviewComment[] | undefined): void => {
    if (!comments) {
      return;
    }

    for (const comment of comments) {
      const model = this.#modelMap.get(comment.path);
      if (model) {
        model.addComment(comment);
      }
    }
  };

  getModel = (path: string | undefined | null): ReviewEditorModel | undefined => {
    if (!path) {
      return undefined;
    }

    const model = this.#modelMap.get(path);
    return model;
  };
}
