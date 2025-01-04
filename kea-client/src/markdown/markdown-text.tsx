import type { Element, Root, Text } from "hast";
import { type Component, createMemo, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Context } from "./types";
import { flattenPosition } from "./utils";

export const MarkdownText: Component<{
  context: Context;
  node: Text;
  index: number;
  parent: Element | Root;
}> = (props) => {
  const childProps = createMemo(() => {
    const context = { ...props.context };
    const options = context.options;
    const node = props.node;
    const parent = props.parent;

    const properties: Record<string, unknown> = { parent };

    // Nodes created by plugins do not have positional info, in which case we use
    // an object that matches the position interface.
    const position = node.position || {
      start: { line: null, column: null, offset: null },
      end: { line: null, column: null, offset: null },
    };

    const component =
      options.components && Object.hasOwn(options.components, "text")
        ? options.components.text
        : null;
    const basic = typeof component === "string";

    properties.key = [
      "text",
      position.start.line,
      position.start.column,
      props.index,
    ].join("-");

    // If `sourcePos` is given, pass source information (line/column info from markdown source).
    if (options.sourcePos) {
      properties["data-sourcepos"] = flattenPosition(position);
    }

    if (!basic && options.rawSourcePos) {
      properties.sourcePosition = node.position;
    }

    if (!basic) {
      properties.node = node;
    }

    return { properties, context, component };
  });

  return (
    <Show when={childProps().component} fallback={props.node.value}>
      <Dynamic
        component={childProps().component || "span"}
        {...childProps().properties}
      />
    </Show>
  );
};
