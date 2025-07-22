import * as vscode from "vscode";
import { IAccountKey } from "../account/account";
import { WrappedError } from "../core/wrapped-error";
import { FileStatus, PullRequestId, RepoId } from "../types/kea";

type ParsedDecorationData =
  | { type: "keaRemoteFiles"; payload: PullRequestFileDecorationPayload }
  | { type: "keaLocalFiles"; payload: LocalFileDecorationPayload }
  | { type: "keaCommentsRoot"; payload: PullRequestCommentsRootDecorationPayload };

type DecorationScheme = ParsedDecorationData["type"];

export const DECORATION_SCHEMES = {
  remoteFiles: "keaRemoteFiles",
  localFiles: "keaLocalFiles",
  commentsRoot: "keaCommentsRoot",
} satisfies Record<string, DecorationScheme>;

interface LocalFileDecorationPayload {
  filePath: string;
  fileStatus: FileStatus;
}

interface PullRequestFileDecorationPayload extends LocalFileDecorationPayload {
  accountKey: IAccountKey;
  repoId: RepoId;
}

const createDecorationUri = (scheme: DecorationScheme, payload: ParsedDecorationData["payload"]): vscode.Uri =>
  vscode.Uri.from({
    scheme,
    query: JSON.stringify(payload),
  });

export const createLocalFileDecorationUri = (payload: LocalFileDecorationPayload): vscode.Uri =>
  createDecorationUri("keaLocalFiles", payload);

export const createRemoteFileDecorationUri = (payload: PullRequestFileDecorationPayload): vscode.Uri =>
  createDecorationUri("keaRemoteFiles", payload);

interface PullRequestCommentsRootDecorationPayload {
  accountKey: IAccountKey;
  pullId: PullRequestId;
}

export const createCommentsRootDecorationUri = (payload: PullRequestCommentsRootDecorationPayload): vscode.Uri =>
  createDecorationUri("keaCommentsRoot", payload);

export const parseDecorationPayload = (uri: vscode.Uri): ParsedDecorationData | Error => {
  let payload: ParsedDecorationData["payload"];
  try {
    payload = JSON.parse(uri.query) as typeof payload;
  } catch (error) {
    return new WrappedError("Failed to parse decoration payload", error);
  }

  const type = uri.scheme as DecorationScheme;
  switch (type) {
    case "keaRemoteFiles":
      return { type: "keaRemoteFiles", payload: payload as PullRequestFileDecorationPayload };
    case "keaLocalFiles":
      return { type: "keaLocalFiles", payload: payload as LocalFileDecorationPayload };
    case "keaCommentsRoot":
      return { type: "keaCommentsRoot", payload: payload as PullRequestCommentsRootDecorationPayload };
    default:
      return new Error(`Unknown decoration scheme: ${type as string}`);
  }
};
