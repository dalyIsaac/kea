import { IssueId } from "./types/kea";

export const isSameIssue = (issueId1: IssueId, issueId2: IssueId): boolean =>
  issueId1.owner === issueId2.owner && issueId1.repo === issueId2.repo && issueId1.number === issueId2.number;

export const isSamePullRequest = isSameIssue;
