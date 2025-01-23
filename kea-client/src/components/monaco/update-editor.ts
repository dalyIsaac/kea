import * as monaco from "monaco-editor";
import { Editor } from "~/monaco/types";
import { scrollToLine } from "./monaco-utils";
import { DiffFileProps, MonacoProps, SingleFileProps } from "./types";

const updateSingleEditor = (
  editor: monaco.editor.IStandaloneCodeEditor,
  props: SingleFileProps,
): monaco.editor.IStandaloneCodeEditor => {
  const model = editor.getModel();
  if (!model) {
    return editor;
  }

  model.setValue(props.content);
  monaco.editor.setModelLanguage(model, props.language);

  return editor;
};

const updateDiffEditor = (
  editor: monaco.editor.IStandaloneDiffEditor,
  props: DiffFileProps,
): monaco.editor.IStandaloneDiffEditor => {
  const originalModel = editor.getOriginalEditor().getModel();
  const modifiedModel = editor.getModifiedEditor().getModel();

  if (!originalModel || !modifiedModel) {
    return editor;
  }

  originalModel.setValue(props.original.content);
  monaco.editor.setModelLanguage(originalModel, props.original.language);

  modifiedModel.setValue(props.modified.content);
  monaco.editor.setModelLanguage(modifiedModel, props.modified.language);

  return editor;
};

export const updateEditor = (editor: Editor, props: MonacoProps): void => {
  if (props.mode === "single") {
    updateSingleEditor(editor as monaco.editor.IStandaloneCodeEditor, props);
    scrollToLine(editor, props.line);
    return;
  }

  const diffEditor = updateDiffEditor(editor as monaco.editor.IStandaloneDiffEditor, props);
  if (props.original.line !== undefined) {
    scrollToLine(diffEditor.getOriginalEditor(), props.original.line);
  }

  if (props.modified.line !== undefined) {
    scrollToLine(diffEditor.getModifiedEditor(), props.modified.line);
  }
};
