import "monaco-editor/min/vs/editor/editor.main.css";
import React, { useEffect, useRef } from "react";
import { InlineLoaderIcon } from "~/components/icons/inline-loader-icon";
import { cleanupEditor } from "./cleaup-editor";
import { createEditor } from "./create-editor";
import { doesModeEqualEditor } from "./monaco-utils";
import { Editor, MonacoProps } from "./types";
import { updateEditor } from "./update-editor";

const Loading: React.FC<{ filename: string | undefined; hasContentLoaded: boolean }> = ({
  filename,
  hasContentLoaded,
}) => {
  if (!filename || hasContentLoaded) {
    return null;
  }

  return <InlineLoaderIcon className="ml-2" />;
};

export const Monaco: React.FC<MonacoProps> = (props) => {
  const editor = useRef<Editor | null>(null);
  const onResize = useRef(() => editor.current?.layout());
  const monacoEl = useRef<HTMLDivElement | null>(null);
  const mounted = useRef(false);

  // Main effect for editor initialization and updates.
  useEffect(() => {
    if (monacoEl.current === null) {
      return;
    }

    if (!mounted.current) {
      mounted.current = true;
      window.addEventListener("resize", onResize.current);
    }

    if (editor.current && doesModeEqualEditor(editor.current, props.mode)) {
      updateEditor(editor.current, props);
      return;
    }

    // Only cleanup the existing editor when switching modes.
    if (editor.current) {
      cleanupEditor(editor.current);
    }

    editor.current = createEditor(monacoEl.current, props);
  }, [props]);

  // Cleanup effect that only runs on unmount.
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      window.removeEventListener("resize", onResize.current);
      cleanupEditor(editor.current);
      editor.current = null;
      mounted.current = false;
    };
  }, []);

  let filenameWrapper: React.ReactNode = null;
  if (props.mode === "single") {
    filenameWrapper = (
      <div className="flex items-center">
        {props.filename ?? "Untitled"}
        <Loading filename={props.filename} hasContentLoaded={!!props.content} />
      </div>
    );
  } else if (props.original.filename || props.modified.filename) {
    filenameWrapper = (
      <div className="flex flex-col justify-between md:flex-row">
        <div className="flex items-center">
          {props.original.filename ?? "(Added)"}
          <Loading filename={props.original.filename} hasContentLoaded={!!props.original.content} />
        </div>
        <div className="flex items-center">
          {props.modified.filename ?? "(Removed)"}
          <Loading filename={props.modified.filename} hasContentLoaded={!!props.modified.content} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-4 py-1 text-sm">{filenameWrapper}</div>

      <div ref={monacoEl} className="h-full w-full" />
    </div>
  );
};
