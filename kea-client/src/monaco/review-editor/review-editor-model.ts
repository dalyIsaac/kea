import { DiffEntry } from "~/api/types";
import { Editor, monaco } from "~/monaco";
import { isCodeEditor, isDiffEditor } from "~/monaco/monaco-utils";
import { ReviewEditorSideModel } from "./review-editor-side-model";
import { ReviewCommentWithPosition } from "./review-editor-types";

export class ReviewEditorModel {
  diffEntry: DiffEntry;
  original: ReviewEditorSideModel | undefined;
  modified: ReviewEditorSideModel | undefined;

  constructor(diffEntry: DiffEntry) {
    this.diffEntry = diffEntry;

    if (diffEntry.status !== "Added") {
      const filename = diffEntry.original_filename ?? "";
      this.original = new ReviewEditorSideModel(filename);
    }

    if (diffEntry.status !== "Removed") {
      const filename = diffEntry.current_filename;
      this.modified = new ReviewEditorSideModel(filename);
    }
  }

  apply = (editor: Editor | null, element: HTMLDivElement): Editor => {
    if (this.original !== undefined && this.modified !== undefined) {
      const diffEditor = ReviewEditorModel.#createDiffEditor(
        editor,
        element,
        this.original.textModel,
        this.modified.textModel,
      );

      diffEditor.getOriginalEditor().changeViewZones(this.original.changeViewZones);
      diffEditor.getModifiedEditor().changeViewZones(this.modified.changeViewZones);

      return diffEditor;
    }

    if (this.original) {
      const originalEditor = ReviewEditorModel.#createSingleEditor(editor, element, this.original.textModel);
      originalEditor.changeViewZones(this.original.changeViewZones);
      return originalEditor;
    }

    if (this.modified) {
      const singleEditor = ReviewEditorModel.#createSingleEditor(editor, element, this.modified.textModel);
      singleEditor.changeViewZones(this.modified.changeViewZones);
      return singleEditor;
    }

    throw new Error("At least one side must be present");
  };

  setText = (editor: Editor, text: string, side: "original" | "modified"): void => {
    if (side === "original" && this.original !== undefined) {
      this.original.textModel.setValue(text);
      this.original.hasLoadedText = true;
      this.applyComments(editor);
      return;
    }

    if (side === "modified" && this.modified !== undefined) {
      this.modified.textModel.setValue(text);
      this.modified.hasLoadedText = true;
      this.applyComments(editor);
      return;
    }

    throw new Error("Side must be original or modified");
  };

  addComment = (comment: ReviewCommentWithPosition, editor: Editor): void => {
    let hasAdded = false;
    if (comment.data.side === "Original" && this.original !== undefined) {
      this.original.addComment(comment);
      hasAdded = true;
    }

    if (comment.data.side === "Modified" && this.modified !== undefined) {
      this.modified.addComment(comment);
      hasAdded = true;
    }

    if (!hasAdded) {
      throw new Error("Side must be Original or Modified");
    }

    this.applyComments(editor);
  };

  applyComments = (editor: Editor): void => {
    if (isDiffEditor(editor) && this.original !== undefined && this.modified !== undefined) {
      editor.getOriginalEditor().changeViewZones(this.original.changeViewZones);
      editor.getModifiedEditor().changeViewZones(this.modified.changeViewZones);
      return;
    }

    if (isCodeEditor(editor)) {
      const callback = this.original?.changeViewZones ?? this.modified?.changeViewZones;

      if (callback !== undefined) {
        editor.changeViewZones(callback);
      }
      return;
    }
  };

  static #createDiffEditor = (
    editor: Editor | null,
    element: HTMLDivElement,
    originalModel: monaco.editor.ITextModel,
    modifiedModel: monaco.editor.ITextModel,
  ): monaco.editor.IStandaloneDiffEditor => {
    if (!isDiffEditor(editor)) {
      editor?.dispose();
      editor = monaco.editor.createDiffEditor(element, {
        automaticLayout: true,
        readOnly: true,
        renderOverviewRuler: false,
      });
    }

    editor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    return editor;
  };

  static #createSingleEditor = (
    editor: Editor | null,
    element: HTMLDivElement,
    textModel: monaco.editor.ITextModel,
  ): monaco.editor.IStandaloneCodeEditor => {
    if (!isCodeEditor(editor)) {
      editor?.dispose();
      editor = monaco.editor.create(element);
    }

    editor.setModel(textModel);
    return editor;
  };
}
