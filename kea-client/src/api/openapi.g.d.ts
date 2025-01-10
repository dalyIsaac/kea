/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/github/signin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["sign_in"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/github/signout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["sign_out"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/github/{owner}/{repo}/file/{git_ref}/{path}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_file_content"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/github/{owner}/{repo}/pull/{pr_number}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_pull_request_details"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/github/{owner}/{repo}/pull/{pr_number}/commits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_pull_request_commits"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/github/{owner}/{repo}/pull/{pr_number}/files": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_pull_request_files"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/healthcheck": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["healthcheck"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        KeaCommit: {
            author?: null | components["schemas"]["ScmUser"];
            committer?: null | components["schemas"]["ScmUser"];
            message: string;
            parents: components["schemas"]["KeaParentCommit"][];
            sha: string;
        };
        KeaDiffEntry: {
            /** Format: int64 */
            additions: number;
            /** Format: int64 */
            changes: number;
            /** Format: int64 */
            deletions: number;
            filename: string;
            previous_filename?: string | null;
            sha: string;
            status: components["schemas"]["KeaDiffEntryStatus"];
        };
        /** @enum {string} */
        KeaDiffEntryStatus: "Added" | "Removed" | "Modified" | "Renamed" | "Copied" | "Changed" | "Unchanged";
        KeaParentCommit: {
            sha: string;
        };
        KeaPullRequestCommit: {
            label: string;
            sha: string;
        };
        KeaPullRequestDetails: {
            base: components["schemas"]["KeaPullRequestCommit"];
            body?: string | null;
            head: components["schemas"]["KeaPullRequestCommit"];
            /** Format: int64 */
            id: number;
            /** Format: int64 */
            number: number;
            owner: string;
            repo: string;
            title?: string | null;
        };
        MeClients: {
            github?: null | components["schemas"]["ScmUser"];
        };
        ScmUser: {
            /** @description The user's display name. */
            avatar_url: string;
            /** @description The user's unique ID. */
            id: string;
            /** @description The user's login. This is typically the user's username. */
            login: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    sign_in: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": string;
                };
            };
        };
    };
    sign_out: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": string;
                };
            };
        };
    };
    get_file_content: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Owner of the repository */
                owner: string;
                /** @description Repository name */
                repo: string;
                /** @description Git reference */
                git_ref: string;
                /** @description Path to the file */
                path: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": string;
                };
            };
        };
    };
    get_pull_request_details: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Owner of the repository */
                owner: string;
                /** @description Repository name */
                repo: string;
                /** @description Pull request number */
                pr_number: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeaPullRequestDetails"];
                };
            };
        };
    };
    get_pull_request_commits: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Owner of the repository */
                owner: string;
                /** @description Repository name */
                repo: string;
                /** @description Pull request number */
                pr_number: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeaCommit"][];
                };
            };
        };
    };
    get_pull_request_files: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Owner of the repository */
                owner: string;
                /** @description Repository name */
                repo: string;
                /** @description Pull request number */
                pr_number: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["KeaDiffEntry"][];
                };
            };
        };
    };
    healthcheck: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/plain": string;
                };
            };
        };
    };
    me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeClients"];
                };
            };
        };
    };
}
