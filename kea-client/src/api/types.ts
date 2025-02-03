// Common types for the API, re-exported into a readable manner.
// Usage: import * as apiTypes from "~/api/types";

import { components, operations } from "./openapi.g";

export type PullRequestDetails = components["schemas"]["KeaPullRequestDetails"];
export type Commit = components["schemas"]["KeaCommit"];
export type DiffEntry = components["schemas"]["KeaDiffEntry"];
export type ReviewComment = components["schemas"]["KeaPullRequestReviewComment"];

// Params
export type GetPullRequestFilesParams = operations["get_pull_request_files"]["parameters"]["path"];
export type GetPullRequestDetailsParams = operations["get_pull_request_details"]["parameters"]["path"];
