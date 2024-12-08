import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Content } from "~/types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const getStringContent = (content: Content | undefined) => {
  if (
    content !== undefined &&
    !Array.isArray(content) &&
    content.type === "file"
  ) {
    return atob(content.content);
  }
};
