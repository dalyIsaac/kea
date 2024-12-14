import loader from "@monaco-editor/loader";
import * as monacoEditor from "monaco-editor";

export type LoaderParams = Parameters<typeof loader.config>[0];
export type Editor = monacoEditor.editor.IStandaloneDiffEditor;
export type IEditorDecorationsCollection =
  monacoEditor.editor.IEditorDecorationsCollection;
