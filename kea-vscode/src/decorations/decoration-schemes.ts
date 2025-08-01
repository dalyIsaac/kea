import * as vscode from "vscode";
import { IAccountKey } from "../account/account";
import { WrappedError } from "../core/wrapped-error";
import { FileStatus, PullRequestId, RepoId } from "../types/kea";

export const DECORATION_SCHEMES = {
  files: "kea-files" as const,
  commentsRoot: "kea-comments-root" as const,
} satisfies Record<string, string>;

interface PullRequestFileDecorationPayload {
  accountKey: IAccountKey;
  repoId: RepoId;
  filePath: string;
  fileStatus: FileStatus;
}

export const createGitDecorationUri = (payload: PullRequestFileDecorationPayload): vscode.Uri =>
  vscode.Uri.from({
    scheme: DECORATION_SCHEMES.files,
    query: JSON.stringify(payload),
  });

interface PullRequestCommentsRootDecorationPayload {
  accountKey: IAccountKey;
  pullId: PullRequestId;
}

export const createCommentsRootDecorationUri = (payload: PullRequestCommentsRootDecorationPayload): vscode.Uri =>
  vscode.Uri.from({
    scheme: DECORATION_SCHEMES.commentsRoot,
    query: JSON.stringify(payload),
  });

type ParsedDecorationData =
  | { type: typeof DECORATION_SCHEMES.files; payload: PullRequestFileDecorationPayload }
  | { type: typeof DECORATION_SCHEMES.commentsRoot; payload: PullRequestCommentsRootDecorationPayload };

export const parseDecorationPayload = (uri: vscode.Uri): ParsedDecorationData | Error => {
  let payload: ParsedDecorationData["payload"];
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
