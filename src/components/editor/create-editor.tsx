import { Monaco } from "@monaco-editor/loader";
import { MonacoDiffEditorProps } from "./monaco-diff-editor";
import { getOrCreateModel } from "./utils";

export const createEditor = (
  props: MonacoDiffEditorProps,
  monaco: Monaco,
  containerRef: HTMLDivElement,
) => {
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
      ...props.options,
    },
    props.overrideServices,
  );

  editor.setModel({
    original: originalModel,
    modified: modifiedModel,
  });

  return editor;
};
