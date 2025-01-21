import * as monaco from "monaco-editor/esm/vs/editor/editor.api";


export const cleanupEditor = (
  editor: monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor | null,
): void => {
  if (!editor) {
    return;
  }

  if (editor.getEditorType() === monaco.editor.EditorType.ICodeEditor) {
    const model = editor.getModel();
    editor.dispose();

    (model as monaco.editor.ITextModel | null)?.dispose();
    return;
  }

  if (editor.getEditorType() === monaco.editor.EditorType.IDiffEditor) {
    const diffEditor = editor as monaco.editor.IStandaloneDiffEditor;
    editor.dispose();

    diffEditor.getOriginalEditor().getModel()?.dispose();
    diffEditor.getModifiedEditor().getModel()?.dispose();
  }
};