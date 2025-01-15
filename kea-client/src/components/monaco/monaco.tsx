import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import "monaco-editor/min/vs/editor/editor.main.css";
import { useEffect, useRef } from "react";

interface SingleFileProps {
  mode: "single";
  content: string;
  language: string;
}

interface DiffFileProps {
  mode: "diff";
  original: {
    content: string;
    language: string;
  };
  modified: {
    content: string;
    language: string;
  };
}

type MonacoProps = SingleFileProps | DiffFileProps;

export const Monaco: React.FC<MonacoProps> = (props) => {
  const editor = useRef<
    monaco.editor.IStandaloneCodeEditor | monaco.editor.IStandaloneDiffEditor | null
  >(null);
  const monacoEl = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (monacoEl.current === null) {
      return;
    }

    if (editor.current) {
      editor.current.dispose();
      editor.current = null;
    }

    const editorElement = monacoEl.current;

    if (props.mode === "single") {
      editor.current = monaco.editor.create(editorElement, {
        value: props.content,
        language: props.language,
        automaticLayout: true,
      });
    } else {
      const diffEditor = monaco.editor.createDiffEditor(editorElement, {
        automaticLayout: true,
      });

      diffEditor.setModel({
        original: monaco.editor.createModel(props.original.content, props.original.language),
        modified: monaco.editor.createModel(props.modified.content, props.modified.language),
      });

      editor.current = diffEditor;
    }

    const onResize = () => {
      editor.current?.layout();
    };
    window.addEventListener("resize", onResize);

    return () => {
      editor.current?.dispose();
      editor.current = null;
      window.removeEventListener("resize", onResize);
    };
  }, [props]);

  return <div ref={monacoEl} className="h-full w-full" />;
};
