import { monaco } from "~/monaco";
import { ReviewEditorCommentViewZone } from "./review-editor-comment-view-zone";
import { ReviewCommentWithPosition } from "./review-editor-types";

export class ReviewEditorSideModel {
  textModel: monaco.editor.ITextModel;
  hasLoadedText = false;
  #comments = new Map<number, ReviewCommentWithPosition>();
  #viewZonesCache = new Map<number, ReviewEditorCommentViewZone>();

  constructor(filename: string) {
    const url = monaco.Uri.file(filename);
    this.textModel = monaco.editor.getModel(url) ?? monaco.editor.createModel("", "", url);
  }

  addComment = (comment: ReviewCommentWithPosition): void => {
    this.#comments.set(comment.data.id, comment);
  };

  changeViewZones = (accessor: monaco.editor.IViewZoneChangeAccessor): void => {
    if (!this.hasLoadedText) {
      return;
    }

    for (const [id, model] of this.#comments.entries()) {
      if (this.#viewZonesCache.has(id)) {
        continue;
      }

      const viewZone = new ReviewEditorCommentViewZone(model);
      this.#viewZonesCache.set(model.data.id, viewZone);
      accessor.addZone(viewZone);
    }
  };
}
