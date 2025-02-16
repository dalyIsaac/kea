import { ReviewComment } from "~/api/types";

export interface ReviewCommentWithPosition {
  data: ReviewComment;
  startLine: number;
  endLine: number;
}

export type GetStartLineFn = (comment: ReviewComment) => number | undefined;
