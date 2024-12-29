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
- [ ] Set up refresh tokens
- [ ] Add a protected route
- [ ] Set up Cargo clippy as a pre-commit hook

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
