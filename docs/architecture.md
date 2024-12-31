# Architecture

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
