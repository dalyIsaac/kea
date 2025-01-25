import { DiffEntry, ReviewComment } from "~/api/types";
import { Editor, monaco } from "~/monaco";
import { ReviewEditorSideModel } from "./review-editor-side-model";
import { ReviewEditorComment } from "./review-editor-types";

export class ReviewEditorModel {
  diffEntry: DiffEntry;
  original: ReviewEditorSideModel | null = null;
  modified: ReviewEditorSideModel | null = null;

  constructor(diffEntry: DiffEntry) {
    this.diffEntry = diffEntry;

    if (diffEntry.status !== "Added") {
      const filename = diffEntry.original_filename ?? "";
      this.original = new ReviewEditorSideModel(filename);
    }

    if (diffEntry.status !== "Removed") {
      const filename = diffEntry.current_filename ?? "";
      this.modified = new ReviewEditorSideModel(filename);
    }
  }

  apply = (editor: Editor | null, element: HTMLDivElement): Editor => {
    if (this.original && this.modified) {
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

  static #createDiffEditor = (
    editor: Editor | null,
    element: HTMLDivElement,
    originalModel: monaco.editor.ITextModel,
    modifiedModel: monaco.editor.ITextModel,
  ): monaco.editor.IStandaloneDiffEditor => {
    let diffEditor: monaco.editor.IStandaloneDiffEditor;

    if (editor?.getEditorType() === monaco.editor.EditorType.IDiffEditor) {
      diffEditor = editor as monaco.editor.IStandaloneDiffEditor;
    } else {
      editor?.dispose();
      diffEditor = monaco.editor.createDiffEditor(element, {
        automaticLayout: true,
        readOnly: true,
        renderOverviewRuler: false,
      });
    }

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    return diffEditor;
  };

  static #createSingleEditor = (
    editor: Editor | null,
    element: HTMLDivElement,
    textModel: monaco.editor.ITextModel,
  ): monaco.editor.IStandaloneCodeEditor => {
    let singleEditor: monaco.editor.IStandaloneCodeEditor;

    if (editor?.getEditorType() === monaco.editor.EditorType.ICodeEditor) {
      singleEditor = editor as monaco.editor.IStandaloneCodeEditor;
    } else {
      editor?.dispose();
      singleEditor = monaco.editor.create(element);
    }

    singleEditor.setModel(textModel);
    return singleEditor;
  };

  addComment = (comment: ReviewComment): void => {
    let side: ReviewEditorSideModel | null = null;
    let editorComment: ReviewEditorComment;

    if (comment.original_position) {
      side = this.original;

      const { original_position, ...rest } = comment;
      editorComment = {
        ...rest,
        position: original_position,
      };
    } else if (comment.modified_position) {
      side = this.modified;

      const { modified_position, ...rest } = comment;
      editorComment = {
        ...rest,
        position: modified_position,
      };
    } else {
      return;
    }

    side?.addComment(editorComment);
  };
}
