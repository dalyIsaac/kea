import * as monaco from "monaco-editor";
import { ReviewCommentWithPosition } from "./review-editor-types";

export class ReviewEditorCommentViewZone implements monaco.editor.IViewZone {
  readonly model: ReviewCommentWithPosition;

  #domNode: HTMLElement = document.createElement("div");

  constructor(model: ReviewCommentWithPosition) {
    this.model = model;
    this.#domNode.textContent = model.data.body;
  }

  get domNode() {
    return this.#domNode;
  }

  get afterLineNumber() {
    return this.model.startLine;
  }
}
