import { stringify as commas } from "comma-separated-tokens";
import { Element, Root } from "hast";
import { find } from "property-information";
import { stringify as spaces } from "space-separated-tokens";
import { Position } from "unist";
import { Context } from "./types";

export const getInputElement = (node: Element | Root): Element | null => {
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index];

    if (child?.type === "element" && child.tagName === "input") {
      return child;
    }
  }

  return null;
};

export const getElementsBeforeCount = (
  parent: Element | Root,
  node?: Element | undefined,
): number => {
  let count = 0;

  for (let index = 0; index < parent.children.length; index++) {
    const child = parent.children[index];

    if (child === node) {
      return count;
    }

    count += 1;
  }

  return count;
};

export const addProperty = (
  props: Record<string, unknown>,
  prop: string,
  value: unknown,
  ctx: Context,
): void => {
  const info = find(ctx.schema, prop);
  let result = value;

  if (info.property === "className") {
    // TODO: Does this ever happen?
    info.property = "class";
  }

  if (result === null || result === undefined || Number.isNaN(result)) {
    return;
  }

  if (Array.isArray(result)) {
    result = info.commaSeparated ? commas(result) : spaces(result);
  }

  if (info.space && info.property) {
    props[info.property] = result;
  } else if (info.attribute) {
    props[info.attribute] = result;
  }
};

export const flattenPosition = (
  position:
    | Position
    | {
        start: { line: null; column: null; offset: null };
        end: { line: null; column: null; offset: null };
      },
): string =>
  `${position.start.line}:${position.start.column}-${position.end.line}:${position.end.column}`;
