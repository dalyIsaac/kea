import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FC, useEffect, useRef } from "react";

export const Monaco: FC<{ className?: string }> = ({ className }) => {
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (monacoEl.current === null) {
      return;
    }

    if (editor.current) {
      return;
    }

    editor.current = monaco.editor.create(monacoEl.current, {
      value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join("\n"),
      language: "typescript",
    });

    return () => {
      editor.current?.dispose();
      editor.current = null;
    };
  }, []);

  return <div ref={monacoEl} className={className} />;
};
