import { ReviewComment, ReviewCommentPosition } from "~/api/types";

export type ReviewEditorComment = Omit<ReviewComment, "original_position" | "modified_position"> & {
  position: ReviewCommentPosition;
};
