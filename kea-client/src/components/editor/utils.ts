import { Monaco } from "@monaco-editor/loader";
import { createSignal } from "solid-js";
import { MonacoDiffEditorProps } from "./monaco-diff-editor";
import { Editor, IEditorDecorationsCollection } from "./types";

export const [editor, setEditor] = createSignal<Editor>();
export const [monaco, setMonaco] = createSignal<Monaco>();
export const [decorationsCollection, setDecorationsCollection] =
  createSignal<IEditorDecorationsCollection>();

export const getModel = (monaco: Monaco, path: string) => {
  const pathUri = monaco.Uri.parse(path);
  return monaco.editor.getModel(pathUri);
};

export const createModel = (
  monaco: Monaco,
  value: string,
  language?: string,
  path?: string,
) => {
  const pathUri = path != null ? monaco.Uri.parse(path) : undefined;
  return monaco.editor.createModel(value, language, pathUri);
};

export const getOrCreateModel = (
  monaco: Monaco,
  value: string,
  language?: string,
  path?: string,
) => {
  const existingModel = path != null ? getModel(monaco, path) : null;
  return existingModel ?? createModel(monaco, value, language, path);
};

export const createEditor = (
  props: MonacoDiffEditorProps,
  monaco: Monaco,
  containerRef: HTMLDivElement,
): Editor => {
  const originalModel = getOrCreateModel(
    monaco,
    props.original ?? "",
    props.originalLanguage,
    props.originalPath,
  );
  const modifiedModel = getOrCreateModel(
    monaco,
    props.modified ?? "",
    props.modifiedLanguage,
    props.modifiedPath,
  );

  const editor = monaco.editor.createDiffEditor(
    containerRef,
    {
      automaticLayout: true,
      glyphMargin: true,
      ...props.options,
    },
    props.overrideServices,
  );

  editor.setModel({
    original: originalModel,
    modified: modifiedModel,
  });

  setEditor(editor);
  setDecorationsCollection(
    editor.createDecorationsCollection([
      {
        range: new monaco.Range(3, 1, 3, 1),
        options: {
          isWholeLine: true,
          className: "bg-pink-400",
          glyphMarginClassName: "bg-blue-400",
        },
      },
    ]),
  );

  return editor;
};
