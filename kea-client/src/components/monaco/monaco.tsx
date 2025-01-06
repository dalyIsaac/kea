import { Box } from "@primer/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FC, useEffect, useRef, useState } from "react";

export const Monaco: FC = () => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (monacoEl.current === null) {
      return;
    }

    setEditor((editor) => {
      if (editor) {
        return editor;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return monaco.editor.create(monacoEl.current!, {
        value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join(
          "\n",
        ),
        language: "typescript",
      });
    });

    return () => editor?.dispose();
  }, [editor]);

  return <Box ref={monacoEl} sx={{ height: "50vh" }} />;
};
