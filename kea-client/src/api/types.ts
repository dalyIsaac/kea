// Common types for the API, re-exported into a readable manner.
// Usage: import * as apiTypes from "~/api/types";

import { components } from "./openapi.g";

export type PullRequestDetails = components["schemas"]["KeaPullRequestDetails"];
