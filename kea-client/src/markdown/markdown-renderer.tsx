import type { Element, Root, Text } from "hast";
import { svg } from "property-information";
import { type Component, createMemo, For, Match, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";
import { MarkdownText } from "./markdown-text";
import type { Context, SolidMarkdownNames } from "./types";
import {
  addProperty,
  flattenPosition,
  getElementsBeforeCount,
  getInputElement,
} from "./utils";

export const MarkdownRoot: Component<{
  context: Context;
  node: Root | null;
}> = (props) =>
  props.node === null ? null : (
    <MarkdownChildren node={props.node} context={props.context} />
  );

export const MarkdownChildren: Component<{
  context: Context;
  node: Element | Root;
}> = (props) => (
  <For each={props.node.children}>
    {(child, index) => (
      <Switch>
        <Match when={child.type === "element"}>
          <MarkdownNode
            context={props.context}
            index={index()}
            node={child as Element}
            parent={props.node}
          />
        </Match>

        <Match when={child.type === "text" && child.value !== "\n"}>
          <MarkdownText
            context={props.context}
            index={index()}
            node={child as Text}
            parent={props.node}
          />
        </Match>
      </Switch>
    )}
  </For>
);

// TODO: Reduce duplication between MarkdownNode and MarkdownText
export const MarkdownNode: Component<{
  context: Context;
  node: Element;
  index: number;
  parent: Element | Root;
}> = (props) => {
  const childProps = createMemo(() => {
    const context = { ...props.context };
    const options = context.options;
    const parentSchema = context.schema;
    const node = props.node;
    const name = node.tagName as SolidMarkdownNames;
    const parent = props.parent;

    const properties: Record<string, unknown> = {};
    let schema = parentSchema;
    let property: string;

    if (parentSchema.space === "html" && name === "svg") {
      schema = svg;
      context.schema = schema;
    }

    if (node.properties) {
      for (property in node.properties) {
        if (Object.hasOwn(node.properties, property)) {
          addProperty(properties, property, node.properties[property], context);
        }
      }
    }

    if (name === "ol" || name === "ul") {
      context.listDepth++;
    }

    if (name === "ol" || name === "ul") {
      context.listDepth--;
    }

    // Restore parent schema.
    context.schema = parentSchema;

    // Nodes created by plugins do not have positional info, in which case we use
    // an object that matches the position interface.
    const position = node.position ?? {
      start: { line: null, column: null, offset: null },
      end: { line: null, column: null, offset: null },
    };

    const component =
      options.components && Object.hasOwn(options.components, name)
        ? options.components[name]
        : name;
    const basic = typeof component === "string"; //|| component === React.Fragment;

    properties.key = [
      name,
      position.start.line,
      position.start.column,
      props.index,
    ].join("-");

    if (name === "a" && options.linkTarget) {
      properties.target =
        typeof options.linkTarget === "function"
          ? options.linkTarget(
              String(properties.href || ""),
              node.children,
              typeof properties.title === "string"
                ? properties.title
                : undefined,
            )
          : options.linkTarget;
    }

    if (name === "a" && options.transformLinkUri) {
      properties.href = options.transformLinkUri(
        String(properties.href || ""),
        node.children,
        typeof properties.title === "string" ? properties.title : undefined,
      );
    }

    if (
      !basic &&
      name === "code" &&
      parent.type === "element" &&
      parent.tagName !== "pre"
    ) {
      properties.inline = true;
    }

    if (
      !basic &&
      (name === "h1" ||
        name === "h2" ||
        name === "h3" ||
        name === "h4" ||
        name === "h5" ||
        name === "h6")
    ) {
      properties.level = Number.parseInt(name.charAt(1), 10);
    }

    if (name === "img" && options.transformImageUri) {
      properties.src = options.transformImageUri(
        String(properties.src || ""),
        String(properties.alt || ""),
        typeof properties.title === "string" ? properties.title : undefined,
      );
    }

    if (!basic && name === "li" && parent.type === "element") {
      const input = getInputElement(node);
      properties.checked = input?.properties
        ? Boolean(input.properties.checked)
        : null;
      properties.index = getElementsBeforeCount(parent, node);
      properties.ordered = parent.tagName === "ol";
    }

    if (!basic && (name === "ol" || name === "ul")) {
      properties.ordered = name === "ol";
      properties.depth = context.listDepth;
    }

    if (name === "td" || name === "th") {
      if (properties.align) {
        if (!properties.style) properties.style = {};
        // @ts-expect-error assume `style` is an object
        properties.style.textAlign = properties.align;
        // biome-ignore lint/performance/noDelete: <explanation>
        delete properties.align;
      }

      if (!basic) {
        properties.isHeader = name === "th";
      }
    }

    if (!basic && name === "tr" && parent.type === "element") {
      properties.isHeader = Boolean(parent.tagName === "thead");
    }

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

    // If `includeElementIndex` is given, pass node index info to components.
    if (!basic && options.includeElementIndex) {
      properties.index = getElementsBeforeCount(parent, node);
      properties.siblingCount = getElementsBeforeCount(parent);
    }

    return { properties, context, component };
  });

  return (
    <Dynamic component={childProps().component} {...childProps().properties}>
      <MarkdownChildren node={props.node} context={childProps().context} />
    </Dynamic>
  );
};
