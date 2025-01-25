import * as monaco from "monaco-editor";
import { ReviewComment, ReviewCommentPosition } from "~/api/types";
export { monaco };

export type Editor = monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor;

export interface BaseFileProps {
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

export type ReviewEditorComment = Omit<ReviewComment, "modified_position" | "position"> & {
  position: ReviewCommentPosition;
};
