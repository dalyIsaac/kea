import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FC, useEffect, useRef } from "react";

export const Monaco: FC = () => {
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (monacoEl.current === null) {
      return;
    }

    if (editor.current) {
      return;
    }

    const editorElement = monacoEl.current;

    editor.current = monaco.editor.create(editorElement, {
      value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join("\n"),
      language: "typescript",
    });

    const onResize = () => {
      editor.current?.layout();
    };
    window.addEventListener("resize", onResize);

    return () => {
      editor.current?.dispose();
      editor.current = null;
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <div ref={monacoEl} className="h-full w-full" />;
};
