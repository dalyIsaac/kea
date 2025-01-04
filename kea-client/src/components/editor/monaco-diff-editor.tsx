import loader, { Monaco } from "@monaco-editor/loader";
import * as monacoEditor from "monaco-editor";
import {
  createEffect,
  JSX,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { LoaderParams } from "./types";
import {
  createEditor,
  editor,
  getOrCreateModel,
  monaco,
  setMonaco,
} from "./utils";

const viewStates = new Map();

export interface MonacoDiffEditorProps {
  original?: string | undefined;
  modified?: string | undefined;

  originalLanguage?: string;
  modifiedLanguage?: string;

  originalPath?: string;
  modifiedPath?: string;

  loadingState?: JSX.Element;
  class?: string;
  theme2?: Monaco;
  theme?: monacoEditor.editor.BuiltinTheme | string;
  overrideServices?: monacoEditor.editor.IEditorOverrideServices;
  options?: monacoEditor.editor.IStandaloneEditorConstructionOptions;
  saveViewState?: boolean;
  loaderParams?: LoaderParams;
  onChange?: (value: string) => void;
  onMount?: (
    monaco: Monaco,
    editor: monacoEditor.editor.IStandaloneDiffEditor,
  ) => void;
  onBeforeUnmount?: (
    monaco: Monaco,
    editor: monacoEditor.editor.IStandaloneDiffEditor,
  ) => void;
}

export const MonacoDiffEditor = (inputProps: MonacoDiffEditorProps) => {
  const props = mergeProps(
    {
      theme: "vs",
      loadingState: "Loading…",
      saveViewState: true,
    },
    inputProps,
  );

  let containerRef: HTMLDivElement;

  let abortInitialization: (() => void) | undefined;
  let monacoOnChangeSubscription: any;
  let isOnChangeSuppressed = false;

  onMount(async () => {
    loader.config(inputProps.loaderParams ?? { monaco: monacoEditor });
    const loadMonaco = loader.init();

    abortInitialization = () => loadMonaco.cancel();

    try {
      const monaco = await loadMonaco;
      const editor = createEditor(props, monaco, containerRef);

      setMonaco(monaco);
      props.onMount?.(monaco, editor);

      monacoOnChangeSubscription = editor.onDidUpdateDiff(() => {
        if (!isOnChangeSuppressed) {
          props.onChange?.(editor.getModifiedEditor().getValue());
        }
      });
    } catch (error: any) {
      if (error?.type === "cancelation") {
        return;
      }

      console.error("Could not initialize Monaco", error);
    }
  });

  onCleanup(() => {
    const _editor = editor();
    if (_editor === undefined) {
      abortInitialization?.();
      return;
    }

    props.onBeforeUnmount?.(monaco()!, _editor);
    monacoOnChangeSubscription?.dispose();
    _editor.getModel()?.original.dispose();
    _editor.getModel()?.modified.dispose();
    _editor.dispose();
  });

  createEffect(
    on(
      () => props.modified,
      (modified) => {
        const _editor = editor()?.getModifiedEditor();
        if (!_editor || typeof modified === "undefined") {
          return;
        }

        if (_editor.getOption(monaco()!.editor.EditorOption.readOnly)) {
          _editor.setValue(modified);
          return;
        }

        if (modified !== _editor.getValue()) {
          isOnChangeSuppressed = true;

          _editor.executeEdits("", [
            {
              range: _editor.getModel()!.getFullModelRange(),
              text: modified,
              forceMoveMarkers: true,
            },
          ]);

          _editor.pushUndoStop();
          isOnChangeSuppressed = false;
        }
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.original,
      (original) => {
        const _editor = editor()?.getOriginalEditor();
        if (!_editor || typeof original === "undefined") {
          return;
        }

        if (_editor.getOption(monaco()!.editor.EditorOption.readOnly)) {
          _editor.setValue(original);
        }
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.options,
      (options) => {
        editor()?.updateOptions(options ?? {});
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.theme,
      (theme) => {
        monaco()?.editor.setTheme(theme);
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.originalLanguage,
      (language) => {
        const model = editor()?.getModel();
        if (!language || !model) {
          return;
        }

        monaco()?.editor.setModelLanguage(model.original, language);
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => props.modifiedLanguage,
      (language) => {
        const model = editor()?.getModel();
        if (!language || !model) {
          return;
        }

        monaco()?.editor.setModelLanguage(model.modified, language);
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => [props.originalPath, props.modifiedPath],
      ([originalPath, modifiedPath], prevPaths) => {
        const _monaco = monaco();
        if (!_monaco || !prevPaths) {
          return;
        }

        const [prevOriginalPath, prevModifiedPath] = prevPaths;

        const currentModels = editor()?.getModel();
        let originalModel = currentModels?.original;
        let modifiedModel = currentModels?.modified;

        if (prevOriginalPath !== originalPath) {
          if (props.saveViewState && originalPath != null) {
            viewStates.set(
              prevOriginalPath,
              editor()?.getOriginalEditor().saveViewState(),
            );
          }

          originalModel = getOrCreateModel(
            _monaco,
            props.original ?? "",
            props.originalLanguage,
            originalPath,
          );
        }

        if (prevModifiedPath !== modifiedPath) {
          if (props.saveViewState && prevModifiedPath != null) {
            viewStates.set(
              prevModifiedPath,
              editor()?.getModifiedEditor().saveViewState(),
            );
          }

          modifiedModel = getOrCreateModel(
            _monaco,
            props.modified ?? "",
            props.modifiedLanguage,
            modifiedPath,
          );
        }

        editor()?.setModel({
          modified: modifiedModel!,
          original: originalModel!,
        });

        if (props.saveViewState) {
          editor()
            ?.getOriginalEditor()
            .restoreViewState(viewStates.get(originalPath));
          editor()
            ?.getModifiedEditor()
            .restoreViewState(viewStates.get(modifiedPath));
        }
      },
      { defer: true },
    ),
  );

  return (
    <div class="flex h-full w-full">
      {!editor() && (
        <div class="flex h-full w-full items-center justify-center">
          {props.loadingState}
        </div>
      )}

      <div class="h-full w-full" ref={containerRef!} />
    </div>
  );
};
