import { useEffect, useRef } from "react";
import { Editor } from "~/monaco/types";
import { cleanupEditor } from "./cleaup-editor";
import { createEditor } from "./create-editor";
import { doesModeEqualEditor } from "./monaco-utils";
import { MonacoProps } from "./types";
import { updateEditor } from "./update-editor";

export const useMonacoLifecycle = (
  props: MonacoProps,
  monacoElRef: React.RefObject<HTMLDivElement>,
  editorRef: React.MutableRefObject<Editor | null>,
): void => {
  const onResizeRef = useRef(() => editorRef.current?.layout());
  const mountedRef = useRef(false);

  // Main effect for editor initialization and updates.
  useEffect(() => {
    if (monacoElRef.current === null) {
      return;
    }

    if (!mountedRef.current) {
      mountedRef.current = true;
      window.addEventListener("resize", onResizeRef.current);
    }

    if (editorRef.current && doesModeEqualEditor(editorRef.current, props.mode)) {
      updateEditor(editorRef.current, props);
      return;
    }

    // Only cleanup the existing editor when switching modes.
    if (editorRef.current) {
      cleanupEditor(editorRef.current);
    }

    editorRef.current = createEditor(monacoElRef.current, props);
  }, [editorRef, monacoElRef, props]);

  // Cleanup effect that only runs on unmount.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      window.removeEventListener("resize", onResizeRef.current);
      cleanupEditor(editorRef.current);
      editorRef.current = null;
      mountedRef.current = false;
    };
  }, [editorRef]);
};
