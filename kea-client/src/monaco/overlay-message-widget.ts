import { editor } from "monaco-editor";

/**
 * An overlay widget displays in a fixed position in the editor - it does not display relative to a line.
 */
export class OverlayMessageWidget implements editor.IOverlayWidget {
  #root = document.createElement("div");

  constructor(content: string) {
    this.#root.className =
      "bg-white dark:bg-gray-800 shadow-lg rounded p-2 border border-gray-200 dark:border-gray-700";
    this.#root.textContent = content;
  }

  getId = (): string => "overlay-message-widget";

  getDomNode = (): HTMLElement => this.#root;

  getPosition = (): editor.IOverlayWidgetPosition => ({
    preference: editor.OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER,
  });

  updateContent(content: string) {
    this.#root.textContent = content;
  }
}
