import { html } from "property-information";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { Component, createMemo } from "solid-js";
import { unified } from "unified";
import { VFile } from "vfile";
import { MarkdownRoot } from "~/markdown/markdown-renderer";
import { Options } from "./types";

export interface MarkdownProps {
  /**
   * The markdown to render.
   */
  children: string;

  /**
   * The class to apply to the markdown container.
   */
  class?: string;
}

const DEFAULTS: Options = {
  sourcePos: false,
  rawSourcePos: false,
  skipHtml: false,
  includeElementIndex: false,
  transformLinkUri: null,
  transformImageUri: undefined,
  linkTarget: "_self",
  components: {},
};

export const Markdown: Component<MarkdownProps> = (props) => {
  const generateNode = createMemo(() => {
    if (typeof props.children !== "string") {
      return null;
    }

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true });
    const file = new VFile({ value: props.children });
    const tree = processor.parse(file);
    const node = processor.runSync(tree, file);

    if (node.type !== "root") {
      console.error("Expected root node, got", node.type);
      return null;
    }

    return node;
  });

  return (
    <div class={props.class}>
      <MarkdownRoot
        context={{ options: DEFAULTS, schema: html, listDepth: 0 }}
        node={generateNode()}
      />
    </div>
  );
};
