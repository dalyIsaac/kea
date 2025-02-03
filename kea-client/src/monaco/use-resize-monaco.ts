import React from "react";
import { Editor } from "~/monaco";

export const useResizeMonaco = (editorRef: React.RefObject<Editor | null>): void => {
  React.useEffect(() => {
    const onResize = () => editorRef.current?.layout();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [editorRef]);
};
