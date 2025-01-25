import { DiffEntry } from "~/api/types";
import { ReviewEditorCommentViewZone } from "./review-editor-comment-view-zone";
import { Editor, monaco, ReviewEditorComment } from "./types";

export type Side = "original" | "modified";

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
      return ReviewEditorModel.#createDiffEditor(editor, element, this.original.textModel, this.modified.textModel);
    }

    if (this.original) {
      return ReviewEditorModel.#createSingleEditor(editor, element, this.original.textModel);
    }

    if (this.modified) {
      return ReviewEditorModel.#createSingleEditor(editor, element, this.modified.textModel);
    }

    throw new Error("At least one side must be present");
  };

  static #createDiffEditor = (
    editor: Editor | null,
    element: HTMLDivElement,
    originalModel: monaco.editor.ITextModel,
    modifiedModel: monaco.editor.ITextModel,
  ): Editor => {
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
  ): Editor => {
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
}

export class ReviewEditorSideModel {
  textModel: monaco.editor.ITextModel;
  commentStore: ReviewEditorSideCommentModel;

  constructor(filename: string) {
    const url = monaco.Uri.file(filename);
    this.textModel = monaco.editor.getModel(url) ?? monaco.editor.createModel("", "", url);
    this.commentStore = new ReviewEditorSideCommentModel();
  }
}
/**
 * Manages comments for a file, on a specific side of the editor.
 */
class ReviewEditorSideCommentModel {
  #viewZonesCache = new Map<number, ReviewEditorCommentViewZone>();

  #commentsMap = new Map<number, ReviewEditorComment>();

  addComment = (comment: ReviewEditorComment): void => {
    this.#commentsMap.set(comment.id, comment);
  };

  updateViewZones = (accessor: monaco.editor.IViewZoneChangeAccessor): void => {
    for (const comment of this.#commentsMap.values()) {
      if (this.#viewZonesCache.has(comment.id)) {
        continue;
      }

      const viewZone = new ReviewEditorCommentViewZone(comment);
      this.#viewZonesCache.set(comment.id, viewZone);
      accessor.addZone(viewZone);
    }
  };
}
