import { DiffEntry } from "~/api/types";

export const trimSha = (sha: string) => sha.substring(0, 7);

export const getOriginalFilename = (entry: DiffEntry | undefined) =>
  entry?.original_filename ?? entry?.current_filename;
