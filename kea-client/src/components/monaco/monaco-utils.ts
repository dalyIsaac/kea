import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export const doesModeEqualEditor = (
  editor: monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor | null,
  mode: "single" | "diff",
): boolean => {
  if (!editor) {
    return false;
  }

  if (mode === "single" && editor.getEditorType() === monaco.editor.EditorType.ICodeEditor) {
    return true;
  }

  if (mode === "diff" && editor.getEditorType() === monaco.editor.EditorType.IDiffEditor) {
    return true;
  }

  return false;
};

export const scrollToLine = (editor: monaco.editor.IEditor, line?: number): void => {
  if (line !== undefined) {
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
  }
};
