import * as vscode from "vscode";
import { WrappedError } from "../core/wrapped-error";
import { RepoId } from "../types/kea";

export const DECORATION_SCHEMES = {
  files: "kea-files",
} satisfies Record<string, string>;

interface PullRequestFileDecorationPayload {
  sessionId: string;
  repoId: RepoId;
  filePath: string;
}

export const createCommentDecorationUri = (payload: PullRequestFileDecorationPayload): vscode.Uri =>
  vscode.Uri.from({
    scheme: DECORATION_SCHEMES.files,
    query: JSON.stringify(payload),
  });

interface ParsedDecorationPayload {
  type: (typeof DECORATION_SCHEMES)[keyof typeof DECORATION_SCHEMES];
  payload: PullRequestFileDecorationPayload;
}

export const parseDecorationPayload = (uri: vscode.Uri): ParsedDecorationPayload | Error => {
  let payload: ParsedDecorationPayload["payload"];
  try {
    payload = JSON.parse(uri.query) as typeof payload;
  } catch (error) {
    return new WrappedError("Failed to parse decoration payload", error);
  }

  const type = uri.scheme;
  switch (type) {
    case DECORATION_SCHEMES.files:
      return { type, payload };
    default:
      return new Error(`Unknown decoration scheme: ${type}`);
  }
};
