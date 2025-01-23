import * as monaco from "monaco-editor";
import { PullRequestComment, PullRequestCommentPosition } from "~/api/types";

export class CommentViewZone implements monaco.editor.IViewZone {
  readonly #data: PullRequestComment;
  readonly #position: PullRequestCommentPosition;

  #domNode: HTMLElement = document.createElement("div");

  constructor(comment: PullRequestComment, position: PullRequestCommentPosition) {
    this.#data = comment;
    this.#position = position;

    this.#domNode.textContent = "Hello, world!";
  }

  get domNode() {
    return this.#domNode;
  }

  get afterLineNumber() {
    return this.#position.start_line;
  }
}
