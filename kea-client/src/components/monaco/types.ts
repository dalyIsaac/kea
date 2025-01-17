import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

interface BaseFileProps {
  content: string;
  language: string;
  filename?: string;
}

export interface SingleFileProps extends BaseFileProps {
  mode: "single";
}

export interface DiffFileProps {
  mode: "diff";
  original: BaseFileProps;
  modified: BaseFileProps;
}

export type MonacoProps = SingleFileProps | DiffFileProps;

export type Editor = monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor;
