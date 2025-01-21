import * as monaco from "monaco-editor";
import { DiffFileProps, MonacoProps, SingleFileProps } from "./types";

const createSingleEditor = (
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

const createDiffEditor = (
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

export const createEditor = (element: HTMLDivElement, props: MonacoProps) => {
  if (props.mode === "single") {
    return createSingleEditor(element, props);
  }

  return createDiffEditor(element, props);
};
