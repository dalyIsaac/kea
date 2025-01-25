import { monaco } from "~/monaco";
import { ReviewEditorCommentViewZone } from "./review-editor-comment-view-zone";
import { ReviewEditorComment } from "./review-editor-types";

export class ReviewEditorSideModel {
  textModel: monaco.editor.ITextModel;

  #viewZonesCache = new Map<number, ReviewEditorCommentViewZone>();
  #commentsMap = new Map<number, ReviewEditorComment>();

  constructor(filename: string) {
    const url = monaco.Uri.file(filename);
    this.textModel = monaco.editor.getModel(url) ?? monaco.editor.createModel("", "", url);
  }

  addComment = (comment: ReviewEditorComment): void => {
    this.#commentsMap.set(comment.id, comment);
  };

  changeViewZones = (accessor: monaco.editor.IViewZoneChangeAccessor): void => {
    for (const comment of this.#commentsMap.values()) {
      if (this.#viewZonesCache.has(comment.id)) {
        continue;
      }

      const viewZone = new ReviewEditorCommentViewZone(comment);
      this.#viewZonesCache.set(comment.id, viewZone);
      accessor.addZone(viewZone);
    }
  };
}
