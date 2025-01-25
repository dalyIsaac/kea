import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export const scrollToLine = (editor: monaco.editor.IEditor, line?: number): void => {
  if (line !== undefined) {
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
  }
};
