<img src="./public/kea.png" width="200" height="200" alt="Kea logo">

# Kea

## Plan

### Stage 1: Commits

- [x] Route to commit based on URL
- [x] Display files
- [x] Display diffs between arbitrary commits
- [ ] Show comments on a line
- [ ] Show comments on a range of lines
- [ ] Comment on lines
- [ ] Add suggestions on lines
- [ ] Handle moved files
- [ ] Copy link to a line

#### Backend

- [x] Set up Axum
- [x] Set up authentication
- [x] Set up refresh tokens
- [ ] Add a protected route
- [ ] Set up Cargo clippy as a pre-commit hook
- [ ] Set up openapi generation in the backend and frontend as a pre-commit hook

### Stage 2: Pull Requests

- [x] Route to PR based on URL
- [ ] Display files
- [ ] Display diffs for a PR
- [ ] Display diffs for a commit in a PR
- [ ] Comment on lines
- [ ] Add suggestions on lines
- [ ] Show comments on a PR
- [ ] Show comments on a commit in a PR

### Stage 3: Better diffs

- [ ] Show diffs between commits while ignoring merge commits to the main branch

### Stage 5: Extensibility

- [ ] GitLab interface
- [ ] Add suggestions by inline editing
- [ ] Flexible widget system

## Notes

- A backend is necessary - commit comments requires a hunk position, and hunks can only be provided for the entire commit.

## Backend

| Layer                | Technology                                                                   | Notes                                                                             |
| -------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Programming Language | Rust                                                                         |                                                                                   |
| Web Framework        | [Axum](https://github.com/tokio-rs/axum)                                     | Chosen for its ties to Tokio and popularity compared to other Rust web frameworks |
| OpenAPI              | [utoipa](https://github.com/juhaku/utoipa/blob/master/utoipa-axum/README.md) | Chosen for its popularity                                                         |

Considered alternatives for the backend which have OpenAPI built-in:

- [dropshot](https://github.com/oxidecomputer/dropshot)
- [poem](https://github.com/poem-web/poem)

## Frontend

| Layer             | Technology                                                                        | Notes                                                                                               |
| ----------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Web Framework     | [SolidJS](https://www.solidjs.com/)                                               | Performance and similarity to React                                                                 |
| Styling           | [Tailwind CSS](https://tailwindcss.com/)                                          | Utility-first CSS framework                                                                         |
| Querying          | [Tanstack Query](https://tanstack.com/query/latest/docs/framework/solid/overview) | It works in SolidJS                                                                                 |
| OpenAPI           | [openapi-typescript](https://github.com/openapi-ts/openapi-typescript)            | Chosen for its popularity                                                                           |
| Component Library | [solid-ui](https://github.com/stefan-karger/solid-ui)                             | Chosen for its similiarity to shadcn-ui for React, and popularity compared to other shadcn variants |

## Random commands

```shell
cd kea-client
npx openapi-typescript http://localhost:3000/api-docs/openapi.json --output ./src/api/openapi.g.d.ts
```
