import * as vscode from "vscode";
import { WrappedError } from "../core/wrapped-error";
import { FileStatus, RepoId } from "../types/kea";

export const DECORATION_SCHEMES = {
  files: "kea-files" as const,
  commentsRoot: "kea-comments-root" as const,
} satisfies Record<string, string>;

interface PullRequestFileDecorationPayload {
  sessionId: string;
  repoId: RepoId;
  filePath: string;
  fileStatus: FileStatus;
  commentCount: number;
}

export const createCommentDecorationUri = (payload: PullRequestFileDecorationPayload): vscode.Uri =>
  vscode.Uri.from({
    scheme: DECORATION_SCHEMES.files,
    query: JSON.stringify(payload),
  });

interface PullRequestCommentsRootDecorationPayload {
  sessionId: string;
  repoId: RepoId;
  commentCount?: number;
}

export const createCommentsRootDecorationUri = (payload: PullRequestCommentsRootDecorationPayload): vscode.Uri =>
  vscode.Uri.from({
    scheme: DECORATION_SCHEMES.commentsRoot,
    query: JSON.stringify(payload),
  });

type ParsedDecorationPayload =
  | { type: typeof DECORATION_SCHEMES.files; payload: PullRequestFileDecorationPayload }
  | { type: typeof DECORATION_SCHEMES.commentsRoot; payload: PullRequestCommentsRootDecorationPayload };

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
      return { type: DECORATION_SCHEMES.files, payload: payload as PullRequestFileDecorationPayload };
    case DECORATION_SCHEMES.commentsRoot:
      return { type: DECORATION_SCHEMES.commentsRoot, payload: payload as PullRequestCommentsRootDecorationPayload };
    default:
      return new Error(`Unknown decoration scheme: ${type}`);
  }
};
