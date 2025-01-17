import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { DiffFileProps, SingleFileProps } from "./types";

export const createSingleEditor = (
  element: HTMLDivElement,
  props: SingleFileProps,
): monaco.editor.IStandaloneCodeEditor => {
  return monaco.editor.create(element, {
    value: props.content,
    language: props.language,
    automaticLayout: true,
    readOnly: true,
  });
};

export const createDiffEditor = (
  element: HTMLDivElement,
  props: DiffFileProps,
): monaco.editor.IStandaloneDiffEditor => {
  const diffEditor = monaco.editor.createDiffEditor(element, {
    automaticLayout: true,
    readOnly: true,
    renderOverviewRuler: false,
  });

  const originalModel = monaco.editor.createModel(
    props.original.content,
    props.original.language,
    props.original.filename ? monaco.Uri.file(props.original.filename) : undefined,
  );

  const modifiedModel = monaco.editor.createModel(
    props.modified.content,
    props.modified.language,
    props.modified.filename ? monaco.Uri.file(props.modified.filename) : undefined,
  );

  diffEditor.setModel({
    original: originalModel,
    modified: modifiedModel,
  });

  return diffEditor;
};

export const updateSingleEditor = (
  editor: monaco.editor.IStandaloneCodeEditor,
  props: SingleFileProps,
): void => {
  const model = editor.getModel();
  if (!model) {
    return;
  }

  model.setValue(props.content);
  monaco.editor.setModelLanguage(model, props.language);
};

export const updateDiffEditor = (
  editor: monaco.editor.IStandaloneDiffEditor,
  props: DiffFileProps,
): void => {
  const originalModel = editor.getOriginalEditor().getModel();
  const modifiedModel = editor.getModifiedEditor().getModel();

  if (!originalModel || !modifiedModel) {
    return;
  }

  originalModel.setValue(props.original.content);
  monaco.editor.setModelLanguage(originalModel, props.original.language);

  modifiedModel.setValue(props.modified.content);
  monaco.editor.setModelLanguage(modifiedModel, props.modified.language);
};

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
