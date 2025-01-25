import * as monaco from "monaco-editor";
import { ReviewEditorComment } from "./review-editor-types";

export class ReviewEditorCommentViewZone implements monaco.editor.IViewZone {
  readonly model: ReviewEditorComment;

  #domNode: HTMLElement = document.createElement("div");

  constructor(comment: ReviewEditorComment) {
    this.model = comment;
    this.#domNode.textContent = comment.body;
  }

  get domNode() {
    return this.#domNode;
  }

  get afterLineNumber() {
    return this.model.position.start_line;
  }
}
