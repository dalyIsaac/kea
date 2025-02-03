import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export const scrollToLine = (editor: monaco.editor.IEditor, line?: number): void => {
  if (line !== undefined) {
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
  }
};

export const isDiffEditor = (editor: monaco.editor.IEditor | undefined | null): editor is monaco.editor.IDiffEditor =>
  editor?.getEditorType() === monaco.editor.EditorType.IDiffEditor;

export const isCodeEditor = (
  editor: monaco.editor.IEditor | undefined | null,
): editor is monaco.editor.IStandaloneCodeEditor => editor?.getEditorType() === monaco.editor.EditorType.ICodeEditor;
