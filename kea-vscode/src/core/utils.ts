import * as vscode from "vscode";

export const formatDate = (date: Date): string =>
  date.toLocaleDateString(vscode.env.language, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });

export const trimLength = (str: string, length: number): string => {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length) + "...";
};
