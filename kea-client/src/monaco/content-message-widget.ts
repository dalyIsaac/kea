import { editor } from "monaco-editor";

/**
 * A content widget displays in the editor at a position relative to a line.
 */
export class ContentMessageWidget implements editor.IContentWidget {
  #root = document.createElement("div");

  allowEditorOverflow = true;
  suppressMouseDown = true;

  constructor(content: string) {
    this.#root.className =
      "bg-white dark:bg-gray-800 shadow-lg rounded p-2 border border-gray-200 dark:border-gray-700";
    this.#root.textContent = content;
  }

  getId = (): string => "message-widget";

  getDomNode = (): HTMLElement => this.#root;

  getPosition = (): editor.IContentWidgetPosition => ({
    position: { lineNumber: 10, column: 1 },
    preference: [editor.ContentWidgetPositionPreference.BELOW],
  });

  updateContent(content: string) {
    this.#root.textContent = content;
  }
}
