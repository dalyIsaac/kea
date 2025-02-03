import { ReviewComment } from "~/api/types";

export interface ReviewCommentWithPosition {
  data: ReviewComment;
  startLine: number;
}

export type GetStartLineFn = (comment: ReviewComment) => number | undefined;
