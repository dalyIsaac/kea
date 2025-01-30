![Kea logo](./kea-client/src/assets/logo-light.gif)

# Kea

## Plan

### Stage 1: Pull Requests

#### UI

- [x] Route to PR based on URL
- [x] Display pull request description
- [x] Display commits in a list
- [x] Display files in a tree
- [x] Display moved files in the tree
  - [x] Display file contents in Monaco
  - [x] Display file names in the tree
  - [x] Display file names in Monaco
- [x] Loading state for the file contents
  - [ ] Fix loading state when switching between files
- [x] Select the first file in the tree by default
- [x] Route to file based on URL
- [ ] Route to file and line based on URL
- [x] Don't display loading icon for files which don't exist (e.g., added/removed files)
- [x] Display loading icon for diff tree
- [x] Display loading icon for commits list
- [x] Console warnings
- [ ] Address Edge accessibility warnings
- [ ] Knip

#### Review

- [ ] "Original" should be the target branch at the time of the commit
- [ ] Fix the direction for the arrows for the branch names
- [ ] Display single-line comments
- [ ] Display multi-line comments
- [ ] Add comment on lines
- [ ] Add suggestions on lines
- [ ] Show comments on a PR
- [ ] Show comments on a commit in a PR
- [ ] Determine language based on file extension
- [ ] Copy link to line
- [ ] Selecting a leaf node should navigate to the first diff in the file
- [ ] Worker thread

#### Backend

- [x] Set up Axum
- [x] Set up authentication
- [x] Set up refresh tokens
- [ ] Handle authentication gracefully with redirects back to the location the user was trying to access
- [ ] Set up Cargo clippy as a pre-commit hook
- [ ] Set up openapi generation in the backend and frontend as a pre-commit hook

### Stage 2: Pull Request Commits

#### UI

- [ ] Route to commit based on URL

#### Review

- [ ] Comment on lines
- [ ] Add suggestions on lines
- [ ] Show comments on a commit

### Stage 3: Pull Request Timeline

- [ ] Display comments
- [ ] Create comments
- [ ] Reply to comments

### Stage 4: Complex Commit Comparisons

- [ ] Add the ability to compare commits while ignoring changes from other commits (e.g., a merge commit)

### Stage 5: GitLab interface

- [ ] Add support for GitLab

### Stage 6: Edge cases

- [ ] Display images in a diff, instead of using Monaco

### Stage 7: Complex Monaco Editor

- [ ] Make suggestions by typing in the Monaco editor

### Stage 8: Optimizations

- [ ] Cache file contents in Redis for diff comments position calculations

## Notes

- A backend is necessary - commit comments requires a hunk position, and hunks can only be provided for the entire commit.
- I need an excuse to write Rust.

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

| Layer             | Technology                                                             | Notes                                         |
| ----------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| Web Framework     | React                                                                  | Chosen for its ecosystem                      |
| Styling           | [Tailwind CSS](https://tailwindcss.com/)                               | Chosen for its utility-first approach         |
| Component Library | [shadcn](https://shadcn.com/)                                          | Chosen for its simplicity and ease of styling |
| Querying          | [Tanstack Query](https://tanstack.com/query/latest/docs/)              | Best choice for React querying                |
| OpenAPI           | [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) | Chosen for its popularity                     |

The frontend may be moved to Tailwind and shadcn in the future.

## Environment variables

Set up a `.env` file in the project root with the following:

```env
DOMAIN=localhost
PORT=3000
CLIENT_URL=http://localhost:5173

TIMEOUT_SECS=120
COOKIE_HEX_KEY=TODO       # 64-character hex string

GITHUB_CLIENT_ID=TODO     # GitHub OAuth application client ID
GITHUB_CLIENT_SECRET=TODO # GitHub OAuth application client secret
```

## Monaco

- A `IContentWidget` is tied to a line/column
- A `IOverlayWidget` is tied to a position in the editor (e.g., the top right corner)
- A `IViewZone` is tied to a line/column, but displayed in the text area

## Diff Comments

### Places where comments will be displayed

1. Diff hunk in the timeline (use the hunk with the line numbers from the API)
2. Monaco editor

### Algorithm

- We get back a list of comments
- For each comment, get the relevant file
- Locate the hunk in the file that the comment refers to
- Calculate the line number in the hunk that the comment refers to

Hunk format:

```diff
@@ -413,8 +418,16 @@ export class SuggestAddon extends Disposable implements ITerminalAddon, ISuggest
         listInactiveFocusOutline: activeContrastBorder
       }));
       this._register(this._suggestWidget.onDidSelect(async e => this.acceptSelectedSuggestion(e)));
-      this._register(this._suggestWidget.onDidHide(() => this._terminalSuggestWidgetVisibleContextKey.set(false)));
+      this._register(this._suggestWidget.onDidHide(() => this._terminalSuggestWidgetVisibleContextKey.reset()));
       this._register(this._suggestWidget.onDidShow(() => this._terminalSuggestWidgetVisibleContextKey.set(true)));
+      this._register(this._suggestWidget.onDidBlurDetails((e) => {
```
