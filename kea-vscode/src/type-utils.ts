import { IssueId } from "./types/kea";

export const isSameIssue = (issueId1: IssueId | undefined, issueId2: IssueId | undefined): boolean =>
  issueId1 !== undefined &&
  issueId2 !== undefined &&
  issueId1.owner === issueId2.owner &&
  issueId1.repo === issueId2.repo &&
  issueId1.number === issueId2.number;

export const isSamePullRequest = isSameIssue;
