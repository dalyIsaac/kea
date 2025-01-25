import { ReviewComment, ReviewCommentPosition } from "~/api/types";

export type ReviewEditorComment = Omit<ReviewComment, "modified_position" | "position"> & {
  position: ReviewCommentPosition;
};
