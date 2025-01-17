import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export interface SingleFileProps {
  mode: "single";
  content: string;
  language: string;
  filename?: string;
}

export interface DiffFileProps {
  mode: "diff";
  original: {
    content: string;
    language: string;
    filename?: string;
  };
  modified: {
    content: string;
    language: string;
    filename?: string;
  };
}

export type MonacoProps = SingleFileProps | DiffFileProps;

export type Editor = monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor;
