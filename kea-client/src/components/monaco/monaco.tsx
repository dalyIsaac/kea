import * as monaco from "monaco-editor";
import "monaco-editor/min/vs/editor/editor.main.css";
import { useEffect, useRef } from "react";
import {
  cleanupEditor,
  createDiffEditor,
  createSingleEditor,
  doesModeEqualEditor,
  updateDiffEditor,
  updateSingleEditor,
} from "./monaco-utils";
import { Editor, MonacoProps } from "./types";

export const Monaco: React.FC<MonacoProps> = (props) => {
  const editor = useRef<Editor | null>(null);
  const onResize = useRef(() => editor.current?.layout());
  const monacoEl = useRef<HTMLDivElement | null>(null);
  const mounted = useRef(false);

  // Main effect for editor initialization and updates
  useEffect(() => {
    if (monacoEl.current === null) {
      return;
    }

    if (!mounted.current) {
      mounted.current = true;
      window.addEventListener("resize", onResize.current);
    }

    if (editor.current && doesModeEqualEditor(editor.current, props.mode)) {
      if (props.mode === "single") {
        updateSingleEditor(editor.current as monaco.editor.IStandaloneCodeEditor, props);
      } else {
        updateDiffEditor(editor.current as monaco.editor.IStandaloneDiffEditor, props);
      }

      return;
    }

    // Only cleanup the existing editor when switching modes
    if (editor.current) {
      cleanupEditor(editor.current);
    }

    if (props.mode === "single") {
      editor.current = createSingleEditor(monacoEl.current, props);
    } else {
      editor.current = createDiffEditor(monacoEl.current, props);
    }
  }, [props]);

  // Cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      window.removeEventListener("resize", onResize.current);
      cleanupEditor(editor.current);
      editor.current = null;
      mounted.current = false;
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-4 py-1 text-sm">
        {props.mode === "single" ? (
          props.filename || "Untitled"
        ) : (
          <div className="flex flex-col justify-between md:flex-row">
            <span>Original: {props.original.filename || "Untitled"}</span>
            <span>Modified: {props.modified.filename || "Untitled"}</span>
          </div>
        )}
      </div>

      <div ref={monacoEl} className="h-full w-full" />
    </div>
  );
};
