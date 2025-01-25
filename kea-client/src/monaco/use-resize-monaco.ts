import React from "react";
import { Editor } from "~/monaco";

export const useResizeMonaco = (editor: Editor | null): void => {
  React.useEffect(() => {
    const onResize = () => editor?.layout();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [editor]);
};
