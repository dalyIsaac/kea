import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { CommentStore } from "~/monaco/comment-store";

interface BaseFileProps {
  content: string;
  language: string;
  filename?: string;
  line?: number;
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

export type MonacoMode = MonacoProps["mode"];

export type MonacoEditorProps = MonacoProps & {
  commentStore?: CommentStore;
};

export type Editor = monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor;
