import "monaco-editor/min/vs/editor/editor.main.css";
import React, { useEffect, useRef } from "react";
import { InlineLoaderIcon } from "~/components/icons/inline-loader-icon";
import { doesModeEqualEditor } from "./monaco-utils";
import { Editor, MonacoEditorProps } from "./types";
import { updateEditor } from "./update-editor";
import { useMonacoLifecycle } from "./use-monaco-lifecycle";

const Loading: React.FC<{ filename: string | undefined; hasContentLoaded: boolean }> = ({
  filename,
  hasContentLoaded,
}) => {
  if (!filename || hasContentLoaded) {
    return null;
  }

  return <InlineLoaderIcon className="ml-2" />;
};

export const Monaco: React.FC<MonacoEditorProps> = (props) => {
  const monacoElRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);

  useMonacoLifecycle(props, monacoElRef, editorRef);

  useEffect(() => {
    if (editorRef.current && doesModeEqualEditor(editorRef.current, props.mode)) {
      updateEditor(editorRef.current, props);
      props.commentStore?.updateViewZones(editorRef.current, props.mode);
    }
  }, [props]);

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

      <div ref={monacoElRef} className="h-full w-full" />
    </div>
  );
};
